import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });
export async function registerPushNotifications(userId) { if (!Device.isDevice || !userId) return null; const current = await Notifications.getPermissionsAsync(); const status = current.status === "granted" ? current.status : (await Notifications.requestPermissionsAsync()).status; if (status !== "granted") return null; const projectId = Constants.expoConfig?.extra?.eas?.projectId; const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data; await setDoc(doc(db, "users", userId), { pushToken: token, pushPlatform: Device.osName, updatedAt: new Date() }, { merge: true }); return token; }
