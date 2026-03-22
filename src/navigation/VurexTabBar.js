import { useContext } from "react";

import { CommonActions } from "@react-navigation/native";

import { BottomTabBarHeightCallbackContext } from "@react-navigation/bottom-tabs";

import { getLabel } from "@react-navigation/elements";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Theme } from "../theme";

import { TAB_ROUTE_ICONS } from "./tabBarIcons";



export function VurexTabBar({ state, descriptors, navigation, insets }) {

  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);



  return (

    <View

      onLayout={(e) => {

        onHeightChange?.(e.nativeEvent.layout.height);

      }}

      style={[

        styles.tabBarRoot,

        {

          paddingBottom: Math.max(insets.bottom, 12),

          shadowColor: "#000",

          shadowOffset: { width: 0, height: -1 },

          shadowOpacity: 0.06,

          shadowRadius: 4,

          elevation: 8,

        },

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

          const iconName = TAB_ROUTE_ICONS[route.name] || "ellipse-outline";



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



          const color = focused ? Theme.text : Theme.muted;

          const badge = options.tabBarBadge;

          return (

            <Pressable

              key={route.key}

              accessibilityRole="button"

              accessibilityState={{ selected: focused }}

              accessibilityLabel={label}

              onPress={onPress}

              style={({ pressed }) => [

                styles.tabBarCell,

                pressed ? styles.tabBarCellPressed : null,

              ]}

              android_ripple={{ color: "rgba(26,26,26,0.08)" }}

            >

              <View style={styles.iconWrap}>

                <Ionicons name={iconName} size={24} color={color} />

                {badge != null && badge !== "" ? (

                  <View style={styles.badge}>

                    <Text style={styles.badgeText} numberOfLines={1}>

                      {String(badge)}

                    </Text>

                  </View>

                ) : null}

              </View>

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



const styles = StyleSheet.create({

  tabBarRoot: {

    backgroundColor: Theme.tabBarBg,

    borderTopWidth: StyleSheet.hairlineWidth,

    borderTopColor: Theme.line,

    paddingTop: 12,

    elevation: 0,

    shadowOpacity: 0,

    shadowOffset: { width: 0, height: 0 },

    shadowRadius: 0,

  },

  tabBarRow: {

    flexDirection: "row",

    alignItems: "center",

    minHeight: 56,

    paddingHorizontal: 4,

  },

  iconWrap: {

    position: "relative",

    alignItems: "center",

    justifyContent: "center",

  },

  badge: {

    position: "absolute",

    top: -6,

    right: -14,

    minWidth: 18,

    height: 18,

    paddingHorizontal: 5,

    borderRadius: 9,

    backgroundColor: "#dc2626",

    alignItems: "center",

    justifyContent: "center",

  },

  badgeText: {

    color: "#fff",

    fontSize: 10,

    fontWeight: "800",

    fontVariant: ["tabular-nums"],

  },

  tabBarCell: {

    flex: 1,

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 8,

    paddingHorizontal: 2,

  },

  tabBarCellPressed: {

    opacity: 0.72,

  },

  tabBarLabel: {

    fontSize: 10,

    fontWeight: "600",

    letterSpacing: 0.2,

    textAlign: "center",

    marginTop: 4,

  },

  tabBarLabelFocused: {

    color: Theme.text,

  },

  tabBarLabelIdle: {

    color: Theme.muted,

  },

});

