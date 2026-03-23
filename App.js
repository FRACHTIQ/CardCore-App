import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BootSplash } from "./src/components/BootSplash";
import { MIN_APP_SPLASH_MS } from "./src/constants/splash";
import { initI18n } from "./src/i18n/config";
import { AuthProvider } from "./src/AuthContext";
import { Root } from "./src/Root";

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    (async () => {
      try {
        await initI18n();
      } catch (e) {
        console.warn("[VUREX] i18n init failed, continuing:", e);
      } finally {
        const elapsed = Date.now() - started;
        const wait = Math.max(0, MIN_APP_SPLASH_MS - elapsed);
        await new Promise((r) => setTimeout(r, wait));
        if (!cancelled) {
          setI18nReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!i18nReady) {
    return (
      <SafeAreaProvider>
        <BootSplash progressDurationMs={MIN_APP_SPLASH_MS} />
      </SafeAreaProvider>
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
