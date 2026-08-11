import { realtimeDb } from "./firebase";\nimport { Capacitor, registerPlugin } from "@capacitor/core";\nconst BackgroundGeolocation = registerPlugin("BackgroundGeolocation");
import { onValue, ref, remove, serverTimestamp, set } from "firebase/database";

const locationRef = (orderId, driverId) => ref(realtimeDb, `deliveryLocations/${orderId}/${driverId}`);

export async function startDriverLocationTracking(orderId, driverId, intervalMs = 7000) {\n  if (Capacitor.isNativePlatform()) {\n    const watcherId = await BackgroundGeolocation.addWatcher({ backgroundMessage: "Miamgo suit votre livraison en cours.", backgroundTitle: "Livraison Miamgo", requestPermissions: true, stale: false, distanceFilter: 10 }, async (location, error) => { if (error || !location) return; await set(locationRef(orderId, driverId), { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy || null, tracking: true, updatedAt: serverTimestamp() }); });\n    return () => BackgroundGeolocation.removeWatcher({ id: watcherId }).then(() => remove(locationRef(orderId, driverId)));\n  }
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
