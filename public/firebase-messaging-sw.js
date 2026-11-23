/* CallMe2Serve — Firebase Cloud Messaging service worker */
/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

let messaging = null;

function initFirebase(config) {
  if (!config || !config.apiKey || !config.projectId) return;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    }
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title =
        (payload.notification && payload.notification.title) ||
        payload.data?.title ||
        "CallMe2Serve";
      const body =
        (payload.notification && payload.notification.body) ||
        payload.data?.body ||
        "";
      const href = payload.data?.href || "/notifications";
      self.registration.showNotification(title, {
        body,
        icon: "/brand-mark.svg",
        badge: "/brand-mark.svg",
        data: { href },
      });
    });
  } catch (err) {
    console.warn("[cmts-sw] firebase init failed", err);
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "CMTS_FIREBASE_CONFIG" && data.config) {
    initFirebase(data.config);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate?.(href);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(href);
      return undefined;
    }),
  );
});

/** Fallback when payload is a raw push without Firebase messaging wired yet. */
self.addEventListener("push", (event) => {
  if (messaging) return;
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "CallMe2Serve", body: event.data?.text() || "" };
  }
  const title = data.notification?.title || data.title || "CallMe2Serve";
  const body = data.notification?.body || data.body || "";
  const href = data.data?.href || data.href || "/notifications";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/brand-mark.svg",
      data: { href },
    }),
  );
});
