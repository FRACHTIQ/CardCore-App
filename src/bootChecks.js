import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import * as TrackingTransparency from "expo-tracking-transparency";

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Beim App-Start: Push-Berechtigung und (iOS) App-Tracking-Status nur lesen.
 * Push wird in Expo Go übersprungen (SDK 53+: kein Remote-Push in Go → keine Modul-Warnung).
 * In __DEV__: Ausgabe in der Metro-Konsole.
 */
export async function runBootPermissionChecks() {
  const result = {
    push: null,
    tracking: null,
    errors: [],
  };

  if (isExpoGo()) {
    result.push = {
      skipped: true,
      reason: "expo_go",
      note:
        "Push-Berechtigung in Expo Go nicht auswertbar — für Tests Development Build nutzen.",
    };
  } else {
    try {
      const Notifications = await import("expo-notifications");
      const push = await Notifications.getPermissionsAsync();
      result.push = {
        status: push.status,
        granted: push.granted,
        canAskAgain: push.canAskAgain,
      };
      if (Platform.OS === "ios" && push.ios) {
        result.push.iosStatus = push.ios.status;
      }
      if (Platform.OS === "android" && push.android) {
        result.push.androidImportance = push.android.importance;
      }
    } catch (e) {
      result.errors.push({
        key: "push",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (Platform.OS === "ios") {
    try {
      const tracking = await TrackingTransparency.getTrackingPermissionsAsync();
      result.tracking = { status: tracking.status };
    } catch (e) {
      result.errors.push({
        key: "tracking",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    result.tracking = { status: "not_ios" };
  }

  if (__DEV__) {
    console.log(
      "[VUREX boot] Push / Tracking (nur Entwicklung)",
      JSON.stringify(result, null, 2)
    );
  }

  return result;
}
