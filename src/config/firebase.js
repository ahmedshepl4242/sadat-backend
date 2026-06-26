const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure to set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
// with the path to your Firebase service account key JSON file
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountPath) {
        console.warn('Firebase service account key not provided. FCM notifications will be disabled.');
        return null;
      }

      // Try to parse as JSON string first (for environment variables)
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountPath);
      } catch (parseError) {
        // If parsing fails, treat as file path
        serviceAccount = require(serviceAccountPath);
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('Firebase Admin SDK initialized successfully');
    }
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
};

// Get Firebase messaging instance
const getMessaging = () => {
  const firebaseAdmin = initializeFirebase();
  return firebaseAdmin ? firebaseAdmin.messaging() : null;
};

module.exports = {
  initializeFirebase,
  getMessaging,
  admin
}; 