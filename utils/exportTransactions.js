// utils/exportTransactions.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export async function exportTransactionsAsCSV(transactions) {
  try {
    if (!transactions || transactions.length === 0) {
      Alert.alert('Export', 'No transactions to export.');
      return;
    }

    const header = 'Title,Amount,Date,Category,Recurring,Installment';
    const rows = transactions.map(t => {
      return [
        `"${t.title}"`,
        t.amount,
        `"${t.date}"`,
        `"${t.category}"`,
        t.recurring ? 'Yes' : 'No',
        t.installment ? 'Yes' : 'No'
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const path = FileSystem.documentDirectory + 'transactions_export.csv';

    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path);
  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Error', 'Could not export transactions.');
  }
}
