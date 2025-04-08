// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTransaction } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../App';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../App';
import { CATEGORIES } from '../constants/categories';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS = {
  Housing: '#4F46E5',
  Food: '#10B981',
  Transport: '#F59E0B',
  Bills: '#EF4444',
  Entertainment: '#8B5CF6',
  Health: '#EC4899',
  Shopping: '#3B82F6',
  Other: '#6B7280',
};

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

export default function HomeScreen({ navigation }) {
  const { transactions, addTransaction } = useTransaction();
  const { currentTheme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [budgets, setBudgets] = useState({});
  const { 
    getTotalIncome, 
    getTotalExpenses, 
    getBalance,
    getRecentTransactions,
    selectedDateRange,
    setSelectedDateRange
  } = useTransaction();

  const dateRanges = ['Week', 'Month', 'Year', 'All'];

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

  useFocusEffect(
    React.useCallback(() => {
      loadBudgets();
    }, [])
  );

  useEffect(() => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    setCurrentMonth(monthNames[now.getMonth()]);

    // Yaklaşan ödemeleri hesapla
    const calculateUpcomingPayments = () => {
      const upcoming = [];
      const now = new Date();
      
      transactions.forEach(transaction => {
        if (transaction.recurring) {
          const nextPayment = new Date(transaction.date);
          nextPayment.setMonth(nextPayment.getMonth() + 1);
          
          if (nextPayment > now) {
            const daysUntilDue = Math.ceil((nextPayment - now) / (1000 * 60 * 60 * 24));
            upcoming.push({
              title: transaction.title,
              amount: transaction.amount,
              dueDate: nextPayment,
              daysUntilDue,
            });
          }
        }
      });

      // Tarihe göre sırala
      upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
      setUpcomingPayments(upcoming.slice(0, 5)); // En yakın 5 ödeme
    };

    calculateUpcomingPayments();
  }, [transactions]);

  const getMonthlyIncome = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' &&
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getMonthlyExpenses = (category = null) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const isInCurrentMonth = transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        const matchesCategory = !category || transaction.category === category;
        return isInCurrentMonth && matchesCategory && transaction.amount < 0;
      })
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  };

  const getBudgetProgress = (category) => {
    const budget = budgets[category] || 0;
    const spent = getMonthlyExpenses(category);
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    
    let color = '#10B981'; // safe
    if (percentage >= 100) {
      color = '#EF4444'; // danger
    } else if (percentage >= 80) {
      color = '#F59E0B'; // warning
    }
    
    return {
      spent,
      budget: Number(budget) || 0,
      percentage,
      color
    };
  };

  const renderBudgetProgress = () => {
    if (!budgets || Object.keys(budgets).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            Henüz bütçe tanımlanmamış
          </Text>
        </View>
      );
    }

    return Object.entries(budgets).map(([category, budget]) => {
      const progress = getBudgetProgress(category);
      const color = progress > 100 ? '#EF4444' : progress > 80 ? '#F59E0B' : '#10B981';
      
      return (
        <View key={category} style={[styles.budgetCard, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={styles.budgetHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[category] + '20' }]}>
              <MaterialCommunityIcons name={CATEGORY_ICONS[category]} size={24} color={CATEGORY_COLORS[category]} />
            </View>
            <View style={styles.budgetInfo}>
              <Text style={[styles.categoryName, { color: currentTheme.text }]}>{category}</Text>
              <Text style={[styles.budgetAmount, { color: currentTheme.textSecondary }]}>
                {progress.spent.toFixed(2)} / {progress.budget.toFixed(2)} TL
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: currentTheme.border }]}>
              <View style={[styles.progressFill, { 
                width: `${Math.min(progress.percentage, 100)}%`,
                backgroundColor: color
              }]} />
            </View>
            <Text style={[styles.progressText, { color }]}>{Math.round(progress.percentage)}%</Text>
          </View>
        </View>
      );
    });
  };

  const renderRecentTransactions = () => (
    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Recent Transactions</Text>
      {getRecentTransactions().map(transaction => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionItem}
          onPress={() => navigation.navigate('Transactions')}
        >
          <View style={[styles.transactionIcon, { backgroundColor: CATEGORY_COLORS[transaction.category] }]}>
            <MaterialCommunityIcons name={CATEGORY_ICONS[transaction.category]} size={24} color="#fff" />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{transaction.title}</Text>
            <Text style={[styles.transactionDate, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {new Date(transaction.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Text style={[
            styles.transactionAmount,
            { color: transaction.type === 'income' ? '#10B981' : '#EF4444' }
          ]}>
            {transaction.type === 'income' ? '+' : '-'}
            {Math.abs(transaction.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUpcomingPayments = () => (
    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Upcoming Payments</Text>
      {upcomingPayments.map((payment, index) => (
        <View key={index} style={styles.upcomingPaymentItem}>
          <View style={styles.upcomingPaymentInfo}>
            <Text style={[styles.upcomingPaymentTitle, { color: isDarkMode ? '#fff' : '#000' }]}>{payment.title}</Text>
            <Text style={[styles.upcomingPaymentDate, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              Due in {payment.daysUntilDue} days
            </Text>
          </View>
          <Text style={[styles.upcomingPaymentAmount, { color: '#EF4444' }]}>
            {Math.abs(payment.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#2c3e50' }]}>Budget Tracker</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.gradient}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{getTotalIncome().toFixed(2)} TL</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{getTotalExpenses().toFixed(2)} TL</Text>
            </View>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>{getBalance().toFixed(2)} TL</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.dateRangeContainer}>
        {dateRanges.map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.dateRangeButton,
              selectedDateRange === range && styles.selectedDateRange,
              { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }
            ]}
            onPress={() => setSelectedDateRange(range)}
          >
            <Text style={[
              styles.dateRangeText,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderBudgetProgress()}

      <View style={[styles.recentTransactionsCard, { backgroundColor: isDarkMode ? '#1F2937' : '#fff' }]}>
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Recent Transactions</Text>
        {getRecentTransactions(5).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
              <MaterialCommunityIcons 
                name={CATEGORY_ICONS[transaction.category]} 
                size={24} 
                color={isDarkMode ? '#fff' : '#000'} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={[styles.transactionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                {transaction.installment ? transaction.installmentDescription : transaction.title}
              </Text>
              <Text style={[styles.transactionCategory, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {transaction.category}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: transaction.amount > 0 ? '#10B981' : '#EF4444' }
            ]}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} TL
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddTransaction')}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryCard: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dateRangeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDateRange: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  budgetCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  budgetInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentTransactionsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
