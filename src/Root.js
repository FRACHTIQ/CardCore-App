import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "./AuthContext";
import { runBootPermissionChecks } from "./bootChecks";
import { SPLASH_MS } from "./constants/splash";
import { BootSplash } from "./components/BootSplash";
import UpdateAvailableModal from "./components/UpdateAvailableModal";
import { AuthNavigator } from "./navigation/AuthNavigator";
import { MainNavigator } from "./navigation/MainNavigator";
import { API_BASE_URL } from "./config";
import { compareSemver } from "./utils/compareSemver";
import MaintenanceGateScreen from "./screens/MaintenanceGateScreen";
import { registerExpoPushTokenWithBackend } from "./push/registerExpoPushToken";

function applyStatusPayload(data, setGate) {
  if (data?.maintenance?.enabled) {
    setGate({
      loading: false,
      maintenanceMode: true,
      maintenanceMessage: data.maintenance.message || "",
      needsUpdate: false,
      requiredMinVersion: "",
    });
    return;
  }
  const cur =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "1.0.0";
  const min = data?.min_native_version || "1.0.0";
  if (data && compareSemver(cur, min) < 0) {
    setGate({
      loading: false,
      maintenanceMode: false,
      maintenanceMessage: "",
      needsUpdate: true,
      requiredMinVersion: min,
    });
    return;
  }
  setGate({
    loading: false,
    maintenanceMode: false,
    maintenanceMessage: "",
    needsUpdate: false,
    requiredMinVersion: "",
  });
}

export function Root() {
  const { token, ready } = useAuth();
  const [bootReady, setBootReady] = useState(false);
  const [updateModalDismissed, setUpdateModalDismissed] = useState(false);
  const [gate, setGate] = useState({
    loading: true,
    maintenanceMode: false,
    maintenanceMessage: "",
    needsUpdate: false,
    requiredMinVersion: "",
  });

  const retryAppStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/app/status`);
      const data = r.ok ? await r.json() : null;
      if (data) {
        applyStatusPayload(data, setGate);
        setUpdateModalDismissed(false);
      }
    } catch {
      /* unverändert */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, , statusData] = await Promise.all([
        runBootPermissionChecks(),
        new Promise((r) => setTimeout(r, SPLASH_MS)),
        fetch(`${API_BASE_URL}/api/app/status`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      if (cancelled) {
        return;
      }

      const data = statusData;
      if (data) {
        applyStatusPayload(data, setGate);
      } else {
        setGate({
          loading: false,
          maintenanceMode: false,
          maintenanceMessage: "",
          needsUpdate: false,
          requiredMinVersion: "",
        });
      }
      setBootReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !token || !bootReady) {
      return;
    }
    registerExpoPushTokenWithBackend(token);
  }, [ready, token, bootReady]);

  const showMainUi = ready && bootReady && !gate.loading;

  const showUpdateModal =
    showMainUi &&
    gate.needsUpdate &&
    !updateModalDismissed &&
    !gate.maintenanceMode;

  if (gate.maintenanceMode) {
    return (
      <>
        <MaintenanceGateScreen
          message={gate.maintenanceMessage}
          onRetry={retryAppStatus}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  return showMainUi ? (
    <>
      <NavigationContainer>
        {token ? <MainNavigator /> : <AuthNavigator />}
        <StatusBar style="dark" />
      </NavigationContainer>
      <UpdateAvailableModal
        visible={showUpdateModal}
        requiredMinVersion={gate.requiredMinVersion}
        onLater={() => setUpdateModalDismissed(true)}
      />
    </>
  ) : (
    <BootSplash />
  );
}
