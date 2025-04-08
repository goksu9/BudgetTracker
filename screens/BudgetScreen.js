// screens/BudgetScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTransaction } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../App';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../App';
import { useFocusEffect } from '@react-navigation/native';
import { CATEGORIES } from '../constants/categories';

const defaultBudgets = {
  Housing: 3000,
  Food: 2000,
  Transport: 1000,
  Bills: 1500,
  Entertainment: 800,
  Health: 500,
  Shopping: 1000,
  Other: 500,
};

export default function BudgetScreen({ navigation }) {
  const { transactions } = useTransaction();
  const { currentTheme } = useTheme();
  const [budgets, setBudgets] = useState({});
  const [currency, setCurrency] = useState('USD');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    loadCurrency();
    loadBudgets();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadBudgets();
    }, [])
  );

  const loadCurrency = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setCurrency(parsed.currency || 'USD');
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.budgets) {
          setBudgets(userData.budgets);
        }
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetChange = (category, value) => {
    const newBudgets = {
      ...budgets,
      [category]: parseFloat(value) || 0,
    };
    setBudgets(newBudgets);
    AsyncStorage.setItem('budgetLimits', JSON.stringify(newBudgets));
  };

  const getTotalByCategory = (category) => {
    return transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getBarColor = (percent) => {
    if (percent < 20) return currentTheme.success;
    if (percent < 40) return currentTheme.success;
    if (percent < 80) return currentTheme.warning;
    if (percent <= 100) return currentTheme.danger;
    return currentTheme.danger;
  };

  const handleSaveBudget = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const amount = parseFloat(newAmount);
      if (isNaN(amount) || amount < 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const updatedBudgets = {
        ...userData.budgets,
        [editingCategory]: amount
      };

      await setDoc(doc(db, 'users', userId), {
        ...userData,
        budgets: updatedBudgets
      }, { merge: true });

      setBudgets(updatedBudgets);
      setEditingCategory(null);
      setNewAmount('');
      Alert.alert('Success', 'Budget saved successfully');
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  const renderBudgetItem = (category) => {
    const budgetAmount = budgets[category] ?? 0;
    const isEditing = editingCategory === category;

    return (
      <TouchableOpacity
        key={category}
        style={[styles.budgetItem, { backgroundColor: currentTheme.cardBackground }]}
        onPress={() => {
          setEditingCategory(category);
          setNewAmount(budgetAmount.toString());
        }}
      >
        <Text style={[styles.categoryName, { color: currentTheme.text }]}>{category}</Text>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={currentTheme.textSecondary}
            />
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: currentTheme.primary }]}
              onPress={handleSaveBudget}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.amount, { color: currentTheme.text }]}>
            ₺{Number(budgetAmount).toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Budget Settings</Text>
      </View>

      <View style={styles.content}>
        {CATEGORIES.map(category => renderBudgetItem(category))}
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Add Budget</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Category</Text>
              <View style={[styles.categorySelector, { borderColor: currentTheme.border }]}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category && { backgroundColor: currentTheme.primary }
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      { color: selectedCategory === category ? '#fff' : currentTheme.text }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Amount</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                  borderColor: currentTheme.border
                }]}
                placeholder="Enter amount"
                placeholderTextColor={currentTheme.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.border }]}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedCategory('');
                  setAmount('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedCategory('');
                  setAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
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
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryOptionText: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
