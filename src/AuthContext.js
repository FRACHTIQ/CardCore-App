import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { unregisterExpoPushToken } from "./push/registerExpoPushToken";

const TOKEN_KEY = "vurex_jwt";
const ROLE_KEY = "vurex_role";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  /** @type {null | 'user' | 'admin'} */
  const [role, setRoleState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, r] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(ROLE_KEY),
        ]);
        if (!cancelled) {
          setTokenState(t);
          if (r === "admin" || r === "user") {
            setRoleState(r);
          }
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

  useEffect(() => {
    if (!ready || !token) {
      if (!token && ready) {
        setRoleState(null);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/users/me", { token });
        if (cancelled || !data?.user) {
          return;
        }
        const r = data.user.role === "admin" ? "admin" : "user";
        setRoleState(r);
        await AsyncStorage.setItem(ROLE_KEY, r);
      } catch {
        /* Rolle aus Storage beibehalten */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  const setToken = async (value, meta) => {
    setTokenState(value);
    if (value) {
      await AsyncStorage.setItem(TOKEN_KEY, value);
      if (meta?.role === "admin" || meta?.role === "user") {
        setRoleState(meta.role);
        await AsyncStorage.setItem(ROLE_KEY, meta.role);
      }
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(ROLE_KEY);
      setRoleState(null);
    }
  };

  const signOut = async () => {
    const t = token;
    if (t) {
      await unregisterExpoPushToken(t);
    }
    await setToken(null);
  };

  const isAdmin = role === "admin";

  const value = useMemo(
    () => ({ token, role, isAdmin, setToken, signOut, ready }),
    [token, role, isAdmin, ready]
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
