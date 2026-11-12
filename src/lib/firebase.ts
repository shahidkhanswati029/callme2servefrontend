import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  return getApps()[0] || initializeApp(firebaseConfig);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!(await isSupported())) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  return getMessaging(app);
}

/** Request browser permission and return FCM token when Firebase env is set. */
export async function registerPushToken(): Promise<string | null> {
  const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapid) return null;
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  return getToken(messaging, { vapidKey: vapid });
}

export async function listenForegroundPush(
  onPayload: (title: string, body: string) => void,
) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => undefined;
  return onMessage(messaging, (payload) => {
    onPayload(
      payload.notification?.title || "CallMe2Serve",
      payload.notification?.body || "",
    );
  });
}
