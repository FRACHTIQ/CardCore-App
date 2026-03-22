import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileLegalScreen from "../screens/ProfileLegalScreen";
import { Theme, stackScreenDark } from "../theme";

const AuthStack = createNativeStackNavigator();

export function AuthNavigator() {
  const { t } = useTranslation();
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.bg },
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="LegalTerms"
        component={ProfileLegalScreen}
        options={({ route }) => ({
          ...stackScreenDark,
          headerShown: true,
          title:
            route.params?.kind &&
            ["imprint", "terms", "privacy"].includes(route.params.kind)
              ? t(`profile.legal.${route.params.kind}.title`)
              : t("profile.menuTerms"),
        })}
      />
    </AuthStack.Navigator>
  );
}
