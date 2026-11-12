/* Placeholder service worker for Firebase Cloud Messaging.
   Replace firebaseConfig when NEXT_PUBLIC_FIREBASE_* values are set. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "CallMeToServe", body: event.data?.text() || "" };
  }
  const title = data.notification?.title || data.title || "CallMeToServe";
  const body = data.notification?.body || data.body || "";
  event.waitUntil(self.registration.showNotification(title, { body }));
});
