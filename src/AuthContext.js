import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "cardcore_jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await AsyncStorage.getItem(TOKEN_KEY);
        if (!cancelled) {
          setTokenState(t);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setToken = async (value) => {
    setTokenState(value);
    if (value) {
      await AsyncStorage.setItem(TOKEN_KEY, value);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  };

  const signOut = async () => {
    await setToken(null);
  };

  const value = useMemo(
    () => ({ token, setToken, signOut, ready }),
    [token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth außerhalb AuthProvider");
  }
  return ctx;
}
