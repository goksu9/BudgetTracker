// components/StatisticsFilterTabs.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StatisticsFilterTabs({ period, setPeriod, tab, setTab }) {
  const periods = ['Week', 'Month', 'Year', 'All'];
  const tabs = ['Overview', 'Income', 'Expenses'];

  return (
    <View style={{ marginBottom: 15 }}>
      <View style={styles.segmentedControl}>
        {periods.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.segment, period === item && styles.activeSegment]}
            onPress={() => setPeriod(item)}
          >
            <Text style={period === item ? styles.activeText : styles.inactiveText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabNavigation}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tab, tab === item && styles.activeTab]}
            onPress={() => setTab(item)}
          >
            <Text style={tab === item ? styles.activeText : styles.inactiveText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  activeText: {
    color: '#6366F1',
    fontWeight: '500',
  },
  inactiveText: {
    color: '#374151',
  },
});
