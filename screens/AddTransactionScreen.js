// screens/AddTransactionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { FontAwesome5, MaterialIcons, Entypo, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useTransaction } from '../context/TransactionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../constants/categories';

const CATEGORY_ICONS = {
  Housing: 'home-city',
  Food: 'food',
  Transport: 'bus-multiple',
  Bills: 'file-document-outline',
  Entertainment: 'movie-open',
  Health: 'heart-pulse',
  Shopping: 'shopping',
  Other: 'dots-horizontal',
};

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const { addTransaction } = useTransaction();
  const { isDarkMode } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    title: '',
    category: '',
    type: 'expense',
    date: new Date(),
    description: '',
    isRecurring: false,
    isInstallment: false,
    totalInstallments: '',
    currentInstallment: 1,
  });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.isInstallment && (!formData.totalInstallments || parseInt(formData.totalInstallments) < 1)) {
        alert('Lütfen geçerli bir taksit sayısı giriniz');
        return;
      }

      const transaction = {
        ...formData,
        amount: formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
      };

      if (formData.isInstallment) {
        const totalAmount = Math.abs(parseFloat(formData.amount));
        const installmentAmount = totalAmount / parseInt(formData.totalInstallments);
        const installmentTransactions = [];

        // İlk taksit için tarih
        const startDate = new Date(formData.date);
        
        for (let i = 0; i < parseInt(formData.totalInstallments); i++) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);

          installmentTransactions.push({
            ...transaction,
            amount: formData.type === 'expense' ? -installmentAmount : installmentAmount,
            date: installmentDate,
            installmentDescription: `${formData.title} (${i + 1}/${formData.totalInstallments} Taksit Ödemesi)`,
            isInstallment: true,
            currentInstallment: i + 1,
            totalInstallments: parseInt(formData.totalInstallments),
            totalAmount: totalAmount,
            installmentAmount: installmentAmount,
            installmentDate: installmentDate.toISOString(),
            isFutureInstallment: i > 0 // İlk taksit dışındakiler gelecek taksit olarak işaretlenir
          });
        }

        // İlk taksiti hemen ekle
        await addTransaction(installmentTransactions[0]);

        // Gelecek taksitleri AsyncStorage'a kaydet
        const futureInstallments = installmentTransactions.slice(1);
        const existingInstallments = await AsyncStorage.getItem('futureInstallments');
        const allInstallments = existingInstallments 
          ? [...JSON.parse(existingInstallments), ...futureInstallments]
          : futureInstallments;
        
        await AsyncStorage.setItem('futureInstallments', JSON.stringify(allInstallments));

        alert('Taksitli ödeme başarıyla eklendi. İlk taksit bu ay için kaydedildi.');
      } else {
        await addTransaction(transaction);
      }

    navigation.goBack();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('İşlem eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#f5f5f5' }]}>
      <View style={styles.statusBar}>
        <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#666' }]}>9:41</Text>
        <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#666' }]}>WiFi Battery</Text>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#2c3e50' }]}>Add Transaction</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: isDarkMode ? '#fff' : '#4b5563' }]}>Amount</Text>
      <TextInput
            style={[styles.formInput, { 
              backgroundColor: isDarkMode ? '#374151' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
            }]}
            placeholder="0.00 TL"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
        keyboardType="numeric"
            value={formData.amount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
      />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: isDarkMode ? '#fff' : '#4b5563' }]}>Description</Text>
      <TextInput
            style={[styles.formInput, { 
              backgroundColor: isDarkMode ? '#374151' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
            }]}
        placeholder="What was this for?"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: isDarkMode ? '#fff' : '#4b5563' }]}>Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { 
              backgroundColor: isDarkMode ? '#374151' : '#fff',
              borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
              {formData.date.toLocaleDateString('tr-TR')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: isDarkMode ? '#fff' : '#4b5563' }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  formData.category === category && styles.selectedCategory,
                  { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, category }))}
              >
                <View style={[styles.categoryIcon, { backgroundColor: isDarkMode ? '#4B5563' : '#D1D5DB' }]}>
                  <MaterialCommunityIcons 
                    name={CATEGORY_ICONS[category]} 
                    size={24} 
                    color={isDarkMode ? '#fff' : '#000'} 
                  />
                </View>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#fff' : '#4b5563' }]}>
                  {category}
                </Text>
          </TouchableOpacity>
        ))}
          </View>
      </View>

      <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
            Recurring Transaction
          </Text>
          <TouchableOpacity
            style={[
              styles.switch,
              { backgroundColor: formData.isRecurring ? '#6366F1' : '#D1D5DB' }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
          >
            <View style={[
              styles.switchThumb,
              { transform: [{ translateX: formData.isRecurring ? 20 : 0 }] }
            ]} />
          </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
            Installment Payment
          </Text>
          <TouchableOpacity
            style={[
              styles.switch,
              { backgroundColor: formData.isInstallment ? '#6366F1' : '#D1D5DB' }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, isInstallment: !prev.isInstallment }))}
          >
            <View style={[
              styles.switchThumb,
              { transform: [{ translateX: formData.isInstallment ? 20 : 0 }] }
            ]} />
          </TouchableOpacity>
      </View>

        {formData.isInstallment && (
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: isDarkMode ? '#fff' : '#4b5563' }]}>
              Number of Installments
            </Text>
          <TextInput
              style={[styles.formInput, { 
                backgroundColor: isDarkMode ? '#374151' : '#fff',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
              }]}
            keyboardType="numeric"
              placeholder="Enter number of installments"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              value={formData.totalInstallments}
              onChangeText={(text) => {
                const num = parseInt(text) || '';
                setFormData(prev => ({ 
                  ...prev, 
                  totalInstallments: num.toString()
                }));
              }}
            />
          </View>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Add Transaction</Text>
      </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    paddingTop: 40,
  },
  statusText: {
    fontSize: 12,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    width: '23%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 14,
  },
  switch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    padding: 2,
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});