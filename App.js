import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./src/AuthContext";
import { PRIMARY } from "./src/config";
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

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111",
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Marktplatz",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("CreateListing")}
              style={styles.headerBtn}
            >
              <Text style={styles.headerBtnText}>Neu</Text>
            </Pressable>
          ),
        })}
      />
      <HomeStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: "Listing" }}
      />
      <HomeStack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ title: "Neues Listing" }}
      />
    </HomeStack.Navigator>
  );
}

function FavoriteStackNavigator() {
  return (
    <FavoriteStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111",
        headerShadowVisible: false,
      }}
    >
      <FavoriteStack.Screen
        name="FavoritesMain"
        component={FavoritesScreen}
        options={{ title: "Merkzettel" }}
      />
      <FavoriteStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: "Listing" }}
      />
    </FavoriteStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#666",
        tabBarStyle: { borderTopColor: "#eee" },
      }}
    >
      <MainTabs.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: "Marktplatz" }}
      />
      <MainTabs.Screen
        name="Merkzettel"
        component={FavoriteStackNavigator}
        options={{ tabBarLabel: "Merkzettel" }}
      />
      <MainTabs.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: "Nachrichten" }}
      />
      <MainTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profil" }}
      />
    </MainTabs.Navigator>
  );
}

function Root() {
  const { token, ready } = useAuth();

  return ready ? (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
      <StatusBar style="dark" />
    </NavigationContainer>
  ) : (
    <View style={styles.boot}>
      <ActivityIndicator color={PRIMARY} />
      <Text style={styles.bootText}>CardCore</Text>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  bootText: { marginTop: 12, color: "#666", fontSize: 16 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  headerBtnText: { color: PRIMARY, fontSize: 16, fontWeight: "600" },
});
