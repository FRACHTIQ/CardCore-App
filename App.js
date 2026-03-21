import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  CommonActions,
} from "@react-navigation/native";
import { getLabel } from "@react-navigation/elements";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabBarHeightCallbackContext,
} from "@react-navigation/bottom-tabs";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { runBootPermissionChecks } from "./src/bootChecks";
import { PRIMARY } from "./src/config";
import { stackScreenDark } from "./src/theme";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ListingDetailScreen from "./src/screens/ListingDetailScreen";
import CreateListingScreen from "./src/screens/CreateListingScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const FavoriteStack = createNativeStackNavigator();
const MainTabs = createBottomTabNavigator();

const SPLASH_MS = 2000;

const SPLASH_BG = "#000000";
const BAR_FILL = "#ffffff";
const BAR_TRACK = "#3f3f46";
const MADE_MUTED = "#71717a";
const MADE_HEART = "#c9a574";
const MADE_BRAND = "#a1a1aa";

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  const { t } = useTranslation();
  return (
    <HomeStack.Navigator screenOptions={stackScreenDark}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <HomeStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: t("nav.listing") }}
      />
      <HomeStack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ title: t("nav.newListing") }}
      />
    </HomeStack.Navigator>
  );
}

function FavoriteStackNavigator() {
  const { t } = useTranslation();
  return (
    <FavoriteStack.Navigator screenOptions={stackScreenDark}>
      <FavoriteStack.Screen
        name="FavoritesMain"
        component={FavoritesScreen}
        options={{ title: t("tabs.favorites") }}
      />
      <FavoriteStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: t("nav.listing") }}
      />
    </FavoriteStack.Navigator>
  );
}

function CardiqTabBar({ state, descriptors, navigation, insets }) {
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);

  return (
    <View
      onLayout={(e) => {
        onHeightChange?.(e.nativeEvent.layout.height);
      }}
      style={[
        styles.tabBarRoot,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.tabBarRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = getLabel(
            { label: options.tabBarLabel, title: options.title },
            route.name
          );

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route),
                target: state.key,
              });
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabBarCell,
                pressed ? styles.tabBarCellPressed : null,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.06)" }}
            >
              <Text
                style={[
                  styles.tabBarLabel,
                  focused ? styles.tabBarLabelFocused : styles.tabBarLabelIdle,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainNavigator() {
  const { t } = useTranslation();
  return (
    <MainTabs.Navigator
      tabBar={(props) => <CardiqTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <MainTabs.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: t("tabs.marketplace") }}
      />
      <MainTabs.Screen
        name="Merkzettel"
        component={FavoriteStackNavigator}
        options={{ tabBarLabel: t("tabs.favorites") }}
      />
      <MainTabs.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: t("tabs.messages"),
          headerShown: true,
          title: t("tabs.messages"),
          ...stackScreenDark,
        }}
      />
      <MainTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("tabs.profile"),
          headerShown: true,
          title: t("profile.title"),
          ...stackScreenDark,
        }}
      />
    </MainTabs.Navigator>
  );
}

function BootSplash() {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPct(0);
    progress.setValue(0);
    const listenerId = progress.addListener(({ value }) => {
      setPct(Math.round(value * 100));
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPct(100);
      }
    });
    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.boot}>
      <StatusBar style="light" />
      <View style={styles.bootCenter}>
        <View style={styles.bootInner}>
          <Text style={styles.bootLogo}>CARDIQ</Text>
          <Text style={styles.pctText}>{pct}%</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFillWrap,
                { width: barWidth, backgroundColor: BAR_FILL },
              ]}
            />
          </View>
        </View>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.bootFooter}>
        <View style={styles.bootFooterDecor} />
        <Text style={styles.bootFooterLine}>
          <Text style={styles.bootFooterMuted}>{t("splash.footerWith")}</Text>
          <Text style={styles.bootFooterAccent}>{t("splash.footerLove")}</Text>
          <Text style={styles.bootFooterMuted}>{t("splash.footerInBerlin")}</Text>
          <Text style={styles.bootFooterSep}>{t("splash.footerSep")}</Text>
          <Text style={styles.bootFooterBrand}>{t("splash.footerCompany")}</Text>
        </Text>
        <Text style={styles.bootFooterNames}>{t("splash.names")}</Text>
      </SafeAreaView>
    </View>
  );
}

function Root() {
  const { token, ready } = useAuth();
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([
        runBootPermissionChecks(),
        new Promise((r) => setTimeout(r, SPLASH_MS)),
      ]);
      if (!cancelled) {
        setBootReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showMainUi = ready && bootReady;

  return showMainUi ? (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
      <StatusBar style="light" />
    </NavigationContainer>
  ) : (
    <BootSplash />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  bootCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bootInner: {
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  bootLogo: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: -1,
    marginBottom: 20,
  },
  pctText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: BAR_TRACK,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFillWrap: {
    height: "100%",
    borderRadius: 2,
  },
  bootFooter: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  bootFooterDecor: {
    width: 36,
    height: 1,
    backgroundColor: "#3f3f46",
    opacity: 0.75,
    marginBottom: 10,
  },
  bootFooterLine: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.35,
  },
  bootFooterMuted: {
    color: MADE_MUTED,
    fontWeight: "500",
  },
  bootFooterAccent: {
    color: MADE_HEART,
    fontWeight: "700",
  },
  bootFooterSep: {
    color: "#52525b",
    fontWeight: "400",
  },
  bootFooterBrand: {
    color: MADE_BRAND,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bootFooterNames: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerBtnText: { color: PRIMARY, fontSize: 16, fontWeight: "600" },
  headerBtnOnDark: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  tabBarRoot: {
    backgroundColor: SPLASH_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingTop: 12,
    elevation: 0,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  tabBarRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 4,
  },
  tabBarCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tabBarCellPressed: {
    opacity: 0.72,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  tabBarLabelFocused: {
    color: "#f4f4f5",
  },
  tabBarLabelIdle: {
    color: "#52525b",
  },
});
