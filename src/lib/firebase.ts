import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";

type WebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
  enabled?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let cachedConfig: WebConfig | null | undefined;
let appInstance: FirebaseApp | null = null;

function envConfig(): WebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) return null;
  return {
    apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    messagingSenderId,
    appId,
    vapidKey,
    enabled: true,
  };
}

async function loadConfig(): Promise<WebConfig | null> {
  if (cachedConfig !== undefined) return cachedConfig;
  const fromEnv = envConfig();
  if (fromEnv) {
    cachedConfig = fromEnv;
    return fromEnv;
  }
  try {
    const res = await fetch(`${API_URL}/api/notifications/push-config`, {
      credentials: "include",
    });
    const json = (await res.json()) as { success?: boolean; data?: WebConfig };
    if (json?.data?.enabled && json.data.apiKey && json.data.vapidKey) {
      cachedConfig = json.data;
      return json.data;
    }
  } catch {
    // optional
  }
  cachedConfig = null;
  return null;
}

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  const cfg = await loadConfig();
  if (!cfg) return null;
  if (appInstance) return appInstance;
  appInstance =
    getApps()[0] ||
    initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });
  return appInstance;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!(await isSupported())) return null;
  const app = await getFirebaseApp();
  if (!app) return null;
  return getMessaging(app);
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js",
    );
    if (existing) return existing;
    return navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
  } catch {
    return null;
  }
}

/** Request browser permission and return FCM token when Firebase is configured. */
export async function registerPushToken(): Promise<string | null> {
  const cfg = await loadConfig();
  if (!cfg?.vapidKey) return null;
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const sw = await ensureServiceWorker();
  // Pass config into SW so background pushes can initialize Firebase.
  if (sw?.active) {
    sw.active.postMessage({ type: "CMTS_FIREBASE_CONFIG", config: cfg });
  }

  return getToken(messaging, {
    vapidKey: cfg.vapidKey,
    ...(sw ? { serviceWorkerRegistration: sw } : {}),
  });
}

export async function listenForegroundPush(
  onPayload: (title: string, body: string, data?: Record<string, string>) => void,
) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => undefined;
  return onMessage(messaging, (payload) => {
    onPayload(
      payload.notification?.title || "CallMe2Serve",
      payload.notification?.body || "",
      (payload.data || {}) as Record<string, string>,
    );
  });
}
