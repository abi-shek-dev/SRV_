import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ParentDashboard from '../screens/parent/ParentDashboard';
import HomeworkScreen from '../screens/parent/HomeworkScreen';
import AttendanceScreen from '../screens/parent/AttendanceScreen';
import BehaviorScreen from '../screens/parent/BehaviorScreen';
import MoreScreen from '../screens/parent/MoreScreen';

const Tab = createBottomTabNavigator();

const ACTIVE = '#6366f1';
const INACTIVE = '#64748b';
const BG = '#0f172a';

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: BG, borderTopColor: '#1e293b', height: 60 },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Homework: 'book',
            Attendance: 'calendar',
            Behavior: 'star',
            More: 'grid',
          };
          return <Ionicons name={icons[route.name] || 'circle'} size={size} color={color} />;
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
