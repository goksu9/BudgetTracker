// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTransaction } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import { exportTransactionsAsCSV } from '../utils/exportTransactions';

export default function SettingsScreen() {
  const { transactions } = useTransaction();
  const { theme, setTheme: setThemeContext, currentTheme } = useTheme();
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);
  const [syncData, setSyncData] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const currencies = ['USD', 'EUR', 'TL'];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem('userSettings');
        if (stored) {
          const settings = JSON.parse(stored);
          setBudgetAlerts(settings.budgetAlerts);
          setBillReminders(settings.billReminders);
          setMonthlyReports(settings.monthlyReports);
          setSyncData(settings.syncData);
          setCurrency(settings.currency || 'USD');
          setThemeContext(settings.theme || 'light');
          setIsLanguageModalVisible(settings.language === 'tr');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        const settings = {
          budgetAlerts,
          billReminders,
          monthlyReports,
          syncData,
          theme,
          currency,
          language: isLanguageModalVisible ? 'tr' : 'en',
        };
        await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };
    saveSettings();
  }, [budgetAlerts, billReminders, monthlyReports, syncData, theme, currency, isLanguageModalVisible]);

  const handleClearData = () => {
    Alert.alert('Clear Data', 'This will delete all your data!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Data cleared!') },
    ]);
  };

  const handleThemeChange = (newTheme) => {
    setThemeContext(newTheme);
    setIsThemeModalVisible(false);
  };

  const handleCurrencyChange = async (newCurrency) => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      
      await AsyncStorage.setItem('userSettings', JSON.stringify({
        ...parsed,
        currency: newCurrency
      }));
      
      setCurrency(newCurrency);
      setIsCurrencyModalVisible(false);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.profileHeader, { borderBottomColor: currentTheme.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: currentTheme.cardBackground }]} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: currentTheme.text }]}>Ahmet Yılmaz</Text>
          <Text style={[styles.profileEmail, { color: currentTheme.textSecondary }]}>ahmet@example.com</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Preferences</Text>
        <TouchableOpacity onPress={() => setIsCurrencyModalVisible(true)}>
          <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Currency</Text>
            <Text style={[styles.value, { color: currentTheme.textSecondary }]}>{currency}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsThemeModalVisible(true)}>
          <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Theme</Text>
            <Text style={[styles.value, { color: currentTheme.textSecondary }]}>{theme}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Notifications</Text>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Budget Alerts</Text>
          <Switch value={budgetAlerts} onValueChange={setBudgetAlerts} />
        </View>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Bill Reminders</Text>
          <Switch value={billReminders} onValueChange={setBillReminders} />
        </View>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Monthly Reports</Text>
          <Switch value={monthlyReports} onValueChange={setMonthlyReports} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Data Management</Text>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Sync Data</Text>
          <Switch value={syncData} onValueChange={setSyncData} />
        </View>
        <TouchableOpacity onPress={() => exportTransactionsAsCSV(transactions)}>
          <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Export Data</Text>
            <Text style={[styles.value, { color: currentTheme.textSecondary }]}>CSV / PDF</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearData}>
          <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Clear All Data</Text>
            <Text style={[styles.value, { color: currentTheme.danger }]}>Delete</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Account</Text>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Change Password</Text>
          <Text style={[styles.value, { color: currentTheme.textSecondary }]}>{'>'}</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: currentTheme.border }]}>
          <Text style={[styles.label, { color: currentTheme.text }]}>Logout</Text>
          <Text style={[styles.value, { color: currentTheme.textSecondary }]}>{'>'}</Text>
        </View>
      </View>

      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Currency</Text>
            {currencies.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.modalOption,
                  { backgroundColor: currency === curr ? currentTheme.primary : currentTheme.background }
                ]}
                onPress={() => handleCurrencyChange(curr)}
              >
                <Text style={[
                  styles.modalOptionText,
                  { color: currency === curr ? '#fff' : currentTheme.text }
                ]}>{curr}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.border }]}
              onPress={() => setIsCurrencyModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isThemeModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsThemeModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            {['Light', 'Dark'].map((option) => (
              <TouchableOpacity 
                key={option} 
                onPress={() => handleThemeChange(option)}
                style={[
                  styles.modalOption,
                  option === theme && { backgroundColor: currentTheme.primary + '20' }
                ]}
              >
                <Text style={[styles.modalOptionText, { color: currentTheme.text }]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Language</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                { backgroundColor: isLanguageModalVisible ? currentTheme.primary : currentTheme.background }
              ]}
              onPress={() => {
                setIsLanguageModalVisible(true);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                { color: isLanguageModalVisible ? '#fff' : currentTheme.text }
              ]}>Türkçe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.border }]}
              onPress={() => setIsLanguageModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '70%',
  },
  modalOption: {
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});