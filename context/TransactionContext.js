// context/TransactionContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../App';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../App';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [selectedDateRange, setSelectedDateRange] = useState('Month'); // 'Week', 'Month', 'Year', 'All'

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const loadedTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId,
        date: new Date().toISOString()
      });

      setTransactions(prev => [...prev, { id: docRef.id, ...transaction }]);
      return docRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(transactionRef);
      
      setTransactions(prevTransactions => 
        prevTransactions.filter(transaction => transaction.id !== transactionId)
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getFilteredTransactions = (range = selectedDateRange) => {
    const now = new Date();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      switch (range) {
        case 'Week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return transactionDate >= weekAgo;
        case 'Month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return transactionDate >= monthAgo;
        case 'Year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return transactionDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  const getMonthlyTransactions = (date = new Date()) => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === date.getMonth() &&
             transactionDate.getFullYear() === date.getFullYear();
    });
  };

  const getTotalIncome = (range = selectedDateRange) => {
    const filteredTransactions = getFilteredTransactions(range);
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = (range = selectedDateRange) => {
    const filteredTransactions = getFilteredTransactions(range);
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getBalance = (range = selectedDateRange) => {
    return getTotalIncome(range) - getTotalExpenses(range);
  };

  const getCategoryTotal = (category, range = selectedDateRange) => {
    const filteredTransactions = getFilteredTransactions(range);
    return filteredTransactions
      .filter(t => t.category === category && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getRecentTransactions = (limit = 5) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  const getMonthlyExpenses = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth && 
               t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getMonthlyIncome = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && 
               transactionDate <= endOfMonth && 
               t.amount > 0;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const value = {
    transactions,
    budgets,
    selectedDateRange,
    setSelectedDateRange,
    addTransaction,
    deleteTransaction,
    getFilteredTransactions,
    getMonthlyTransactions,
    getTotalIncome,
    getTotalExpenses,
    getBalance,
    getCategoryTotal,
    getRecentTransactions,
    getMonthlyExpenses,
    getMonthlyIncome
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}
