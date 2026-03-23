import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { unregisterExpoPushToken } from "./push/registerExpoPushToken";

const TOKEN_KEY = "vurex_jwt";
const ROLE_KEY = "vurex_role";

const AuthContext = createContext(null);

function isEmailVerified(user) {
  return Boolean(user && user.email_verified_at);
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  /** @type {null | 'user' | 'admin'} */
  const [role, setRoleState] = useState(null);
  const [ready, setReady] = useState(false);
  /** @type {null | object} */
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  /** Erst nach erstem /me für das aktuelle Token (verhindert false „Profilfehler“ vor dem Fetch). */
  const [profileFetchDone, setProfileFetchDone] = useState(false);

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
    if (!ready) {
      return;
    }
    if (!token) {
      setUserProfile(null);
      setRoleState(null);
      setProfileFetchDone(false);
      return;
    }

    let cancelled = false;
    setProfileFetchDone(false);
    setProfileLoading(true);
    (async () => {
      try {
        const data = await api("/api/users/me", { token });
        if (cancelled || !data?.user) {
          return;
        }
        setUserProfile(data.user);
        const r = data.user.role === "admin" ? "admin" : "user";
        setRoleState(r);
        await AsyncStorage.setItem(ROLE_KEY, r);
      } catch {
        if (!cancelled) {
          setUserProfile(null);
        }
      } finally {
        setProfileLoading(false);
        if (!cancelled) {
          setProfileFetchDone(true);
        }
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
      if (meta?.user && typeof meta.user === "object") {
        setUserProfile(meta.user);
      }
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(ROLE_KEY);
      setRoleState(null);
      setUserProfile(null);
    }
  };

  const signOut = async () => {
    const t = token;
    if (t) {
      await unregisterExpoPushToken(t);
    }
    await setToken(null);
  };

  const refreshUserProfile = async () => {
    if (!token) {
      return;
    }
    setProfileLoading(true);
    try {
      const data = await api("/api/users/me", { token });
      if (data?.user) {
        setUserProfile(data.user);
        const r = data.user.role === "admin" ? "admin" : "user";
        setRoleState(r);
        await AsyncStorage.setItem(ROLE_KEY, r);
      }
    } catch {
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const isAdmin = role === "admin";

  const emailVerified = userProfile ? isEmailVerified(userProfile) : null;
  const profileError = Boolean(
    token &&
      ready &&
      profileFetchDone &&
      !profileLoading &&
      userProfile === null
  );
  const needsEmailVerification = Boolean(
    token &&
      ready &&
      profileFetchDone &&
      !profileLoading &&
      userProfile &&
      !isEmailVerified(userProfile)
  );
  const sessionGateLoading = Boolean(
    token && ready && (!profileFetchDone || profileLoading)
  );

  const value = useMemo(
    () => ({
      token,
      role,
      isAdmin,
      setToken,
      signOut,
      ready,
      userProfile,
      profileLoading,
      profileFetchDone,
      profileError,
      emailVerified,
      needsEmailVerification,
      sessionGateLoading,
      refreshUserProfile,
    }),
    [
      token,
      role,
      isAdmin,
      ready,
      userProfile,
      profileLoading,
      profileFetchDone,
      profileError,
      emailVerified,
      needsEmailVerification,
      sessionGateLoading,
    ]
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
