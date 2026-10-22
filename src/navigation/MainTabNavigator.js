import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import FinanceScreen from "../screens/FinanceScreen";
import HealthScreen from "../screens/HealthScreen";
import AIAssistantScreen from "../screens/AIAssistantScreen";
import AgentSettingsScreen from "../screens/AgentSettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();
const AssistantStack = createNativeStackNavigator();

function AssistantStackNavigator() {
  return (
    <AssistantStack.Navigator screenOptions={{ headerShown: false }}>
      <AssistantStack.Screen name="AssistantChat" component={AIAssistantScreen} />
      <AssistantStack.Screen name="AgentSettings" component={AgentSettingsScreen} />
    </AssistantStack.Navigator>
  );
}

const ICONS = {
  Genel: "⬛",
  Finans: "💳",
  Saglik: "❤️",
  Asistan: "🤖",
  Profil: "👤",
};

function TabIcon({ label, focused }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{ICONS[label]}</Text>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.borderGlass,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Genel Bakış"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Genel" focused={focused} /> }}
      />
      <Tab.Screen
        name="Finans"
        component={FinanceScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Finans" focused={focused} /> }}
      />
      <Tab.Screen
        name="Sağlık"
        component={HealthScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Saglik" focused={focused} /> }}
      />
      <Tab.Screen
        name="AI Asistan"
        component={AssistantStackNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Asistan" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
