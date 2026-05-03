import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../config/theme';

export default function CustomCalendarPicker({ visible, onClose, onSelect, initialDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (visible && initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) setCurrentMonth(d);
    }
  }, [visible, initialDate]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: '14.28%', height: 40 }} />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = initialDate === dateStr;
      
      days.push(
        <TouchableOpacity 
          key={i} 
          style={{ width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => {
            onSelect(dateStr);
            onClose();
          }}
        >
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSelected ? theme.amber : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
             <Text style={{ color: isSelected ? '#fff' : theme.text, fontSize: 14, fontWeight: isSelected ? '700' : '400' }}>{i}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', backgroundColor: theme.surface, borderRadius: 16, padding: 16, elevation: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={{ width: '14.28%', textAlign: 'center', color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>{d}</Text>
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {renderDays()}
          </View>

          <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
             <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
               <Text style={{ color: theme.amber, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
