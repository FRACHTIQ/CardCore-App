import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initI18n } from "./src/i18n/config";
import { Theme } from "./src/theme";
import { AuthProvider } from "./src/AuthContext";
import { Root } from "./src/Root";

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n()
      .then(() => setI18nReady(true))
      .catch((e) => {
        console.warn("[VUREX] i18n init failed, continuing:", e);
        setI18nReady(true);
      });
  }, []);

  if (!i18nReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={Theme.text} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
