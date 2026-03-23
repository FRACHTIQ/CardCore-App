import { useTranslation } from "react-i18next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { stackScreenDark } from "../theme";
import { VurexTabBar } from "./VurexTabBar";
import { HomeStackNavigator } from "./HomeStackNavigator";
import { FavoriteStackNavigator } from "./FavoriteStackNavigator";
import MessagesScreen from "../screens/MessagesScreen";
import { ProfileStackNavigator } from "./ProfileStackNavigator";
import InstantScanScreen from "../screens/InstantScanScreen";

const MainTabs = createBottomTabNavigator();

export function MainNavigator() {
  const { t } = useTranslation();
  return (
    <MainTabs.Navigator
      tabBar={(props) => <VurexTabBar {...props} />}
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
        name="InstantScan"
        component={InstantScanScreen}
        options={{
          tabBarLabel: t("tabs.scan"),
          headerShown: false,
        }}
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
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: t("tabs.profile"),
          headerShown: false,
        }}
      />
    </MainTabs.Navigator>
  );
}
