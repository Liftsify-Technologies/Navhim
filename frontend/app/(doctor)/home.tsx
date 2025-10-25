import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function DoctorHomeScreen() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/my');
      const today = new Date();
      const todayAppts = response.data.appointments.filter((apt: any) => {
        const aptDate = new Date(apt.appointment_datetime);
        return aptDate.toDateString() === today.toDateString();
      });
      setAppointments(todayAppts);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>Dr. {user?.first_name} {user?.last_name}</Text>
          </View>
          <View style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#2563eb" />
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <View key={apt.id} style={styles.appointmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={24} color="#2563eb" />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{apt.patient_details?.first_name} {apt.patient_details?.last_name}</Text>
                  <Text style={styles.time}>{new Date(apt.appointment_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{apt.status}</Text>
                </View>
              </View>
              {apt.symptoms && <Text style={styles.symptoms}>Symptoms: {apt.symptoms}</Text>}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No appointments today</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  greeting: { fontSize: 16, color: '#6b7280' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  notificationButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  statsContainer: { padding: 16 },
  statCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  appointmentCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  time: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  statusBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  symptoms: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
});
