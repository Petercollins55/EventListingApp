import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';

// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { collection, getDocs, doc, updateDoc, onSnapshot, initializeFirestore } from 'firebase/firestore';

// Import Expo Calendar module (Permissions module is no longer needed directly)
import * as Calendar from 'expo-calendar';
// import * as Permissions from 'expo-permissions'; // THIS LINE IS REMOVED

// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyC_HAvs7Ip4nrNl2MepnX59XjpgD0-edxM",
  authDomain: "eventlistingrnapp.firebaseapp.com",
  projectId: "eventlistingrnapp",
  storageBucket: "eventlistingrnapp.firebasestorage.app",
  messagingSenderId: "1007333995195",
  appId: "1:1007333995195:web:eed01651bd1c7396e0ef9e",
  measurementId: "G-34TRB66S4B"
};

// Initialize Firebase with the long-polling option for connection stability
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Get a reference to the 'events' collection
const eventsCollectionRef = collection(db, 'events');

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  // CORRECTED LINE: useState(true) instead of true)
  const [loading, setLoading] = useState(true);

  // Use a single useEffect hook for simplicity and correctness
  useEffect(() => {
    // onSnapshot listener provides real-time data and is more efficient than getDocs
    const unsubscribe = onSnapshot(eventsCollectionRef, (snapshot) => {
      const realTimeEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isRSVPed: doc.data().isRSVPed || false
      }));
      setEvents(realTimeEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error listening for real-time updates: ", error);
      Alert.alert("Real-time Error", "Failed to get real-time event updates.");
      setLoading(false);
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  // Function to handle RSVP - now updates Firestore
  const handleRSVP = async (id) => {
    const eventToUpdate = events.find(event => event.id === id);
    if (!eventToUpdate) return;

    const eventDocRef = doc(db, 'events', id);
    const newRSVPStatus = !eventToUpdate.isRSVPed;

    try {
      await updateDoc(eventDocRef, {
        isRSVPed: newRSVPStatus
      });
      // The onSnapshot listener will automatically update the state
      Alert.alert("RSVP Status", newRSVPStatus ? 'You are now RSVPed!' : 'You have un-RSVPed.');
    } catch (error) {
      console.error("Error updating RSVP status: ", error);
      Alert.alert("Error", "Failed to update RSVP status.");
    }
  };

  // Function to handle saving an event to the calendar
  const handleSaveToCalendar = async (event) => {
    // 1. Ask for calendar permissions using Calendar.requestCalendarPermissionsAsync()
    // This replaces the deprecated Permissions.askAsync(Permissions.CALENDAR)
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need calendar permissions to save the event.');
      return;
    }

    // 2. Parse the event date string into a JavaScript Date object
    // You might need to adjust this depending on the exact format of event.date from Firebase
    // For example, if event.date is "YYYY-MM-DD HH:MM:SS", new Date() will parse it.
    // If it's just "YYYY-MM-DD", it will default to midnight UTC.
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Assumes a 1-hour event duration

    // 3. Find the default calendar
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(
      (cal) => cal.isPrimary || (Platform.OS === 'ios' && cal.source.name === 'Default')
    ) || calendars[0]; // Fallback to the first calendar

    if (!defaultCalendar) {
      Alert.alert('Error', 'No writable calendar found on this device.');
      return;
    }

    // 4. Create the event
    try {
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.name,
        startDate,
        endDate,
        location: event.location,
        notes: event.description,
        alarms: [{ relativeOffset: -15 }], // Add an alarm 15 minutes before the event
      });
      Alert.alert('Success', 'Event saved to your calendar!');
    } catch (error) {
      console.error("Error creating calendar event:", error);
      Alert.alert('Error', 'Failed to save event to calendar. Please try again.');
    }
  };

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter(event => event.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcoming Events</Text>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['All', 'Music', 'Tech', 'Art'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === category && styles.filterButtonTextActive
            ]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show loading indicator while fetching data */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loadingIndicator} />
      ) : (
        <ScrollView style={styles.eventList}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
              // --- START CONSOLE LOGGING FOR DEBUGGING ---
              console.log("--- Event Data ---");
              console.log("ID:", event.id);
              console.log("Name:", event.name);
              console.log("Category:", event.category);
              console.log("Description:", event.description);
              console.log("Full Event Object:", event); // Log the entire object for more detail
              console.log("--- End Event Data ---");
              // --- END CONSOLE LOGGING FOR DEBUGGING ---

              return ( // IMPORTANT: The return statement for JSX
                <View key={event.id} style={styles.eventCard}>
                  <Image source={{ uri: event.image }} style={styles.eventImage} />
                  <View style={styles.eventInfo}>
                    {/* Display category, but only if it exists and is not empty */}
                    {event.category ? (
                      <Text style={styles.eventCategory}>{event.category}</Text>
                    ) : null}
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDetail}>🗓️ {event.date}</Text>
                    <Text style={styles.eventDetail}>📍 {event.location}</Text>
                    {/* Display description, but only if it exists and is not empty */}
                    {event.description ? (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.rsvpButton,
                        event.isRSVPed ? styles.rsvpButtonRSVPed : {}
                      ]}
                      onPress={() => handleRSVP(event.id)}
                    >
                      <Text style={styles.rsvpButtonText}>
                        {event.isRSVPed ? 'RSVPed!' : 'RSVP Now'}
                      </Text>
                    </TouchableOpacity>
                    {/* Save to Calendar Button with logic */}
                    <TouchableOpacity
                      style={styles.saveToCalendarButton}
                      onPress={() => handleSaveToCalendar(event)}
                    >
                      <Text style={styles.saveToCalendarButtonText}>Save to Calendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noEventsText}>No events found for this category.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  eventList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  eventImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: 'cover',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  eventCategory: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 3,
  },
  eventDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    lineHeight: 18,
  },
  rsvpButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  rsvpButtonRSVPed: {
    backgroundColor: '#6c757d',
  },
  rsvpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveToCalendarButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  saveToCalendarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noEventsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});