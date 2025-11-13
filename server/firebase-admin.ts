import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging as getAdminMessaging, Messaging } from "firebase-admin/messaging";

let firebaseApp: App | null = null;

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

function initializeFirebaseAdmin(): App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[Firebase] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY env vars. Push notifications will be disabled.",
      );
    }
    return null;
  }

  try {
    const sanitizedKey = PRIVATE_KEY.replace(/\\n/g, "\n");

    firebaseApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: sanitizedKey,
          }),
        });

    console.log("[Firebase] Admin SDK initialized");
    return firebaseApp;
  } catch (error) {
    console.error("[Firebase] Failed to initialize Admin SDK:", error);
    firebaseApp = null;
    return null;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  const app = initializeFirebaseAdmin();
  if (!app) {
    return null;
  }

  try {
    return getAdminMessaging(app);
  } catch (error) {
    console.error("[Firebase] Failed to access messaging service:", error);
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(PROJECT_ID && CLIENT_EMAIL && PRIVATE_KEY);
}
