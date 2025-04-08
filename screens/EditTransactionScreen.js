// screens/EditTransactionScreen.js
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransaction } from '../context/TransactionContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, MaterialIcons, Entypo, Ionicons } from '@expo/vector-icons';

const categoryIcons = {
  Groceries: <FontAwesome5 name="shopping-basket" size={16} color="#4b5563" />, 
  Food: <MaterialIcons name="restaurant" size={16} color="#4b5563" />, 
  Housing: <Entypo name="home" size={16} color="#4b5563" />, 
  Transport: <FontAwesome5 name="bus" size={16} color="#4b5563" />, 
  Entertainment: <MaterialIcons name="movie" size={16} color="#4b5563" />, 
  Shopping: <FontAwesome5 name="shopping-cart" size={16} color="#4b5563" />, 
  Health: <FontAwesome5 name="heartbeat" size={16} color="#4b5563" />, 
  Other: <Ionicons name="ellipsis-horizontal" size={16} color="#4b5563" />, 
};

const categories = ['Groceries', 'Food', 'Housing', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Other'];

export default function EditTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateTransaction } = useTransaction();
  const transaction = route.params?.transaction;

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.title);
  const [date, setDate] = useState(new Date(transaction.date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(transaction.category);
  const [isRecurring, setIsRecurring] = useState(transaction.recurring || false);
  const [isInstallment, setIsInstallment] = useState(transaction.installment || false);
  const [installmentCount, setInstallmentCount] = useState(transaction.remainingInstallments?.toString() || '');

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleUpdate = () => {
    const updated = {
      ...transaction,
      title: description,
      amount: parseFloat(amount),
      date: date.toISOString(),
      category: selectedCategory,
      recurring: isRecurring,
      installment: isInstallment,
      remainingInstallments: isInstallment ? parseInt(installmentCount, 10) : 0,
    };

    updateTransaction(updated);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Transaction</Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{date.toLocaleDateString('tr-TR', {
          day: '2-digit', month: 'short', year: 'numeric'
        })}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.category, selectedCategory === cat && styles.selectedCategory]}
            onPress={() => setSelectedCategory(cat)}
          >
            <View style={styles.iconWithText}>
              {categoryIcons[cat]}
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Recurring Transaction</Text>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Installment Payment</Text>
        <Switch value={isInstallment} onValueChange={setIsInstallment} />
      </View>

      {isInstallment && (
        <>
          <Text style={styles.label}>Installment Count</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Number of Installments"
            value={installmentCount}
            onChangeText={setInstallmentCount}
          />
        </>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
        <Text style={styles.submitButtonText}>Update Transaction</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: '#9ca3af', marginTop: 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.submitButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// (styles kısmı aynı kalabilir)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 15,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  category: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedCategory: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
    borderWidth: 1,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
