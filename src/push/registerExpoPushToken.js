import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { api } from "../api";

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Holt Expo-Push-Token und speichert es am Backend (Broadcast bei neuen Listings).
 * In Expo Go wird übersprungen (kein zuverlässiges Push).
 */
export async function registerExpoPushTokenWithBackend(jwt) {
  if (!jwt || isExpoGo()) {
    return;
  }
  try {
    const Notifications = await import("expo-notifications");
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const expo = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoToken = expo?.data;
    if (!expoToken || typeof expoToken !== "string") {
      return;
    }

    await api("/api/users/me/push-token", {
      token: jwt,
      method: "POST",
      body: { expo_push_token: expoToken },
    });
  } catch (e) {
    if (__DEV__) {
      console.warn("[VUREX push]", e?.message || e);
    }
  }
}

export async function unregisterExpoPushToken(jwt) {
  if (!jwt) {
    return;
  }
  try {
    await api("/api/users/me/push-token", { token: jwt, method: "DELETE" });
  } catch {
    /* offline */
  }
}
