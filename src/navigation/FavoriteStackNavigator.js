import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { stackScreenDark } from "../theme";
import FavoritesScreen from "../screens/FavoritesScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";

const FavoriteStack = createNativeStackNavigator();

export function FavoriteStackNavigator() {
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
