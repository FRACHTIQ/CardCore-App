import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackScreenDark } from "../theme";
import HomeScreen from "../screens/HomeScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import CreateListingScreen from "../screens/CreateListingScreen";

const HomeStack = createNativeStackNavigator();

export function HomeStackNavigator() {
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
