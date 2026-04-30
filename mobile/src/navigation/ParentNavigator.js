import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';

import ParentDashboard from '../screens/parent/ParentDashboard';
import HomeworkScreen from '../screens/parent/HomeworkScreen';
import AttendanceScreen from '../screens/parent/AttendanceScreen';
import BehaviorScreen from '../screens/parent/BehaviorScreen';
import MoreScreen from '../screens/parent/MoreScreen';

const Tab = createBottomTabNavigator();

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.emerald,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home', Homework: 'book', Attendance: 'calendar-outline',
            Behavior: 'star-outline', More: 'grid-outline',
          };
          return <Ionicons name={icons[route.name] || 'circle'} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ParentDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Homework" component={HomeworkScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Behavior" component={BehaviorScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
