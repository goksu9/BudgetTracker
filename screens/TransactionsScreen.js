// screens/TransactionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransaction } from '../context/TransactionContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { CATEGORIES } from '../constants/categories';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { transactions, deleteTransaction, updateTransaction } = useTransaction();
  const { currentTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currency, setCurrency] = useState('USD');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    const loadCurrency = async () => {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setCurrency(parsed.currency || 'USD');
      }
    };
    loadCurrency();
  }, []);

  const categories = [
    'Housing',
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Health',
    'Shopping',
    'Other'
  ];

  const filteredTransactions =
    selectedCategory === 'All'
      ? transactions
      : transactions.filter((t) => t.category === selectedCategory);

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(Math.abs(transaction.amount).toString());
    setEditDescription(transaction.description);
    setEditCategory(transaction.category);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editAmount || !editDescription || !editCategory) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const amount = parseFloat(editAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      const finalAmount = editingTransaction.type === 'expense' ? -amount : amount;

      await updateTransaction(editingTransaction.id, {
        amount: finalAmount,
        description: editDescription,
        category: editCategory,
      });

      setIsEditModalVisible(false);
      setEditingTransaction(null);
      Alert.alert('Success', 'Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              Alert.alert('Success', 'Transaction deleted successfully');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionCard, { backgroundColor: currentTheme.cardBackground }]}>
      <View style={styles.transactionHeader}>
        <Text style={[styles.transactionCategory, { color: currentTheme.text }]}>{item.category}</Text>
        <View style={styles.transactionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTransaction(item)}
          >
            <Ionicons name="pencil" size={20} color={currentTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTransaction(item.id)}
          >
            <Ionicons name="trash" size={20} color={currentTheme.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.amount < 0 ? currentTheme.danger : currentTheme.success }
      ]}>
        {item.amount < 0 ? '-' : '+'}{Math.abs(item.amount).toLocaleString()} {currency}
      </Text>
      <Text style={[styles.transactionDescription, { color: currentTheme.textSecondary }]}>
        {item.installment ? item.installmentDescription : item.description}
      </Text>
      <Text style={[styles.transactionDate, { color: currentTheme.textSecondary }]}>
        {format(new Date(item.date), 'MMM dd, yyyy')}
      </Text>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Edit Transaction</Text>
            
            <Text style={[styles.modalLabel, { color: currentTheme.text }]}>Amount</Text>
            <TextInput
              style={[styles.modalInput, { color: currentTheme.text, borderColor: currentTheme.border }]}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={[styles.modalLabel, { color: currentTheme.text }]}>Description</Text>
            <TextInput
              style={[styles.modalInput, { color: currentTheme.text, borderColor: currentTheme.border }]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter description"
              placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={[styles.modalLabel, { color: currentTheme.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: editCategory === category ? currentTheme.primary : currentTheme.cardBackground }
                  ]}
                  onPress={() => setEditCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: editCategory === category ? '#fff' : currentTheme.text }
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.danger }]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Transactions</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: selectedCategory === 'All' ? currentTheme.primary : currentTheme.cardBackground }
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[
              styles.filterText,
              { color: selectedCategory === 'All' ? '#fff' : currentTheme.text }
            ]}>All</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                { backgroundColor: selectedCategory === category ? currentTheme.primary : currentTheme.cardBackground }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterText,
                { color: selectedCategory === category ? '#fff' : currentTheme.text }
              ]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.transactionsList}
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Text style={styles.addButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  categorySelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
