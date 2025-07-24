# Event Listing React Native App

## Overview
This is a mobile event listing application built with React Native and Expo, utilizing Firebase Firestore for real-time data management. Users can browse events, RSVP, save events to their device calendar, and filter events by category.

## Key Features
* Real-time event display from Firebase Firestore.
* RSVP functionality for events.
* Ability to save event details to the device's calendar.
* Category filtering for event discovery.
* Display of event images, names, locations, dates, and descriptions.
* User-friendly interface.

## How to Run the App Locally

To set up and run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Petercollins55/EventListingApp.git](https://github.com/Petercollins55/EventListingApp.git)
    ```

2.  **Navigate to the project folder:**
    ```bash
    cd EventListingApp
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Start the Expo development server:**
    ```bash
    npm start -- --clear --tunnel
    ```

5.  **Open on emulator/device:**
    * Scan the QR code displayed in your terminal using the Expo Go app on your phone.
    * Or, click "Run on Android device/emulator" from the Metro Bundler page that opens in your browser.

## Challenges and Learnings (Optional, but Recommended)
* **Firebase Data Structure:** Understanding and implementing real-time data synchronization with Firestore was a key learning.
* **Calendar Permissions:** Handling native device permissions for saving events to the calendar required careful implementation.
* **Data Consistency:** Diagnosing and correcting subtle data entry issues (like field names with trailing spaces in Firestore, e.g., "description " instead of "description") was a valuable debugging experience.

---

Developed by Peter Collins
