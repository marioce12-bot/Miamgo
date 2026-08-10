import { realtimeDb } from "./firebase";
import { onValue, ref, remove, serverTimestamp, set } from "firebase/database";

const locationRef = (orderId, driverId) => ref(realtimeDb, `deliveryLocations/${orderId}/${driverId}`);

export function startDriverLocationTracking(orderId, driverId, intervalMs = 7000) {
  let stopped = false;
  const publish = () => navigator.geolocation.getCurrentPosition(async (position) => {
    if (stopped) return;
    await set(locationRef(orderId, driverId), { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy || null, tracking: true, updatedAt: serverTimestamp() });
  }, () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
  publish();
  const timer = window.setInterval(publish, intervalMs);
  return () => { stopped = true; window.clearInterval(timer); return remove(locationRef(orderId, driverId)); };
}

export function subscribeDriverLocation(orderId, driverId, callback) {
  return onValue(locationRef(orderId, driverId), (snapshot) => callback(snapshot.exists() ? snapshot.val() : null));
}
