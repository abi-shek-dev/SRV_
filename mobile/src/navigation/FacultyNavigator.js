import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';

import FacultyDashboard from '../screens/faculty/FacultyDashboard';
import StudentsScreen from '../screens/faculty/StudentsScreen';
import FacultyHomeworkScreen from '../screens/faculty/FacultyHomeworkScreen';
import FacultyAttendanceScreen from '../screens/faculty/FacultyAttendanceScreen';
import FacultyMoreScreen from '../screens/faculty/FacultyMoreScreen';

const Tab = createBottomTabNavigator();

export default function FacultyNavigator() {
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
        tabBarActiveTintColor: theme.amber,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'home', Students: 'people-outline',
            Homework: 'document-text-outline', Attendance: 'calendar-outline', More: 'grid-outline',
          };
          return <Ionicons name={icons[route.name] || 'circle'} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={FacultyDashboard} />
      <Tab.Screen name="Students" component={StudentsScreen} />
      <Tab.Screen name="Homework" component={FacultyHomeworkScreen} />
      <Tab.Screen name="Attendance" component={FacultyAttendanceScreen} />
      <Tab.Screen name="More" component={FacultyMoreScreen} />
    </Tab.Navigator>
  );
}
