import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      const response = await api.get(`/api/appointments/${appointmentId}`);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinVideoCall = () => {
    if (appointment?.zoom_join_url) {
      Linking.openURL(appointment.zoom_join_url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Unable to load appointment details</Text>
      </View>
    );
  }

  const appointmentDate = new Date(appointment.appointment_datetime);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.confirmationContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.confirmationContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#fff" />
          </View>
          <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmationSubtitle}>
            Your appointment has been successfully booked
          </Text>

          <View style={styles.confirmationCard}>
            <View style={styles.confirmationRow}>
              <Ionicons name="person" size={20} color="#2563eb" />
              <Text style={styles.confirmationLabel}>Doctor</Text>
            </View>
            <Text style={styles.confirmationValue}>
              Dr. {appointment.doctor_details?.first_name} {appointment.doctor_details?.last_name}
            </Text>

            <View style={styles.confirmationRow}>
              <Ionicons name="calendar" size={20} color="#2563eb" />
              <Text style={styles.confirmationLabel}>Date & Time</Text>
            </View>
            <Text style={styles.confirmationValue}>
              {appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.confirmationValue}>
              {appointmentDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>

            <View style={styles.confirmationRow}>
              <Ionicons name="videocam" size={20} color="#2563eb" />
              <Text style={styles.confirmationLabel}>Type</Text>
            </View>
            <Text style={styles.confirmationValue}>
              {appointment.appointment_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
            </Text>

            {appointment.zoom_join_url && (
              <>
                <View style={styles.confirmationRow}>
                  <Ionicons name="link" size={20} color="#2563eb" />
                  <Text style={styles.confirmationLabel}>Video Call Link</Text>
                </View>
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleJoinVideoCall}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1e40af']}
                    style={styles.zoomButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="videocam" size={20} color="#fff" />
                    <Text style={styles.zoomButtonText}>Join Video Call</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.replace('/(patient)/appointments')}
          >
            <Text style={styles.doneButtonText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/(patient)')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  confirmationContainer: { flex: 1 },
  confirmationContent: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  successIcon: { marginBottom: 24 },
  confirmationTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  confirmationSubtitle: { fontSize: 16, color: '#d1fae5', marginBottom: 32, textAlign: 'center' },
  confirmationCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', marginBottom: 24 },
  confirmationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  confirmationLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  confirmationValue: { fontSize: 16, color: '#1e293b', marginBottom: 4, fontWeight: '500' },
  zoomButton: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  zoomButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8 },
  zoomButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  doneButton: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12, width: '100%' },
  doneButtonText: { color: '#059669', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  homeButton: { paddingVertical: 16 },
  homeButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
