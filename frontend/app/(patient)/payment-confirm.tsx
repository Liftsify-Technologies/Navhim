import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

export default function PaymentConfirmScreen() {
  const router = useRouter();
  const { appointmentId, amount, doctorName } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Mock payment - directly mark as paid
      const mockPaymentId = 'pay_mock_' + Date.now();
      
      // Update appointment as paid (without actual Razorpay)
      await api.put(`/api/appointments/${appointmentId}/complete-payment`, {
        payment_id: mockPaymentId,
      });

      // Get updated appointment details
      const appointmentResponse = await api.get(`/api/appointments/${appointmentId}`);
      
      setLoading(false);
      
      // Navigate to confirmation page
      router.replace({
        pathname: '/(patient)/confirmation',
        params: {
          appointmentId: appointmentId,
        },
      });

    } catch (error: any) {
      setLoading(false);
      console.error('Payment confirmation error:', error);
      Alert.alert('Error', 'Failed to confirm payment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb', '#3b82f6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Payment Confirmation</Text>
            <Text style={styles.headerSubtitle}>Review and confirm</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Payment Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.iconGradient}
          >
            <Ionicons name="card" size={64} color="#fff" />
          </LinearGradient>
        </View>

        {/* Payment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Doctor</Text>
            <Text style={styles.detailValue}>{doctorName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Consultation Fee</Text>
            <Text style={styles.detailValue}>₹{amount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{amount}</Text>
          </View>
        </View>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={20} color="#2563eb" />
          <Text style={styles.demoText}>Demo Mode - No actual payment required</Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPayment}
          disabled={loading}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.confirmButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Secure Payment Notice */}
        <View style={styles.secureNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
          <Text style={styles.secureText}>Secure mock payment for demo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerGradient: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#dbeafe', marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 20 },
  iconContainer: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  iconGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 8, borderTopWidth: 2, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 18, color: '#1e293b', fontWeight: '700' },
  totalValue: { fontSize: 24, color: '#10b981', fontWeight: '700' },
  demoNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 24, gap: 8 },
  demoText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  confirmButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  confirmButtonGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  secureNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
});
