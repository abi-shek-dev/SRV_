import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import FacultyDashboard from '../screens/faculty/FacultyDashboard';
import StudentsScreen from '../screens/faculty/StudentsScreen';
import FacultyHomeworkScreen from '../screens/faculty/FacultyHomeworkScreen';
import FacultyAttendanceScreen from '../screens/faculty/FacultyAttendanceScreen';
import FacultyMoreScreen from '../screens/faculty/FacultyMoreScreen';

const Tab = createBottomTabNavigator();

const ACTIVE = '#3b82f6';
const INACTIVE = '#64748b';
const BG = '#0f172a';

export default function FacultyNavigator() {
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
            Dashboard: 'home',
            Students: 'people',
            Homework: 'document-text',
            Attendance: 'calendar',
            More: 'grid',
          };
          return <Ionicons name={icons[route.name] || 'circle'} size={size} color={color} />;
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
