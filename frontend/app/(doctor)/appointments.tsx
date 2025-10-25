import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/my');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Appointments</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.patientAvatar}>
                <Ionicons name="person" size={24} color="#2563eb" />
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{appointment.patient_details?.first_name} {appointment.patient_details?.last_name}</Text>
                <Text style={styles.datetime}>{new Date(appointment.appointment_datetime).toLocaleString()}</Text>
              </View>
              <View style={[styles.statusBadge, {backgroundColor: appointment.status === 'scheduled' ? '#dbeafe' : '#fef3c7'}]}>
                <Text style={[styles.statusText, {color: appointment.status === 'scheduled' ? '#2563eb' : '#f59e0b'}]}>{appointment.status}</Text>
              </View>
            </View>
            {appointment.symptoms && <Text style={styles.symptoms}>Symptoms: {appointment.symptoms}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  scrollView: { flex: 1 },
  appointmentCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  datetime: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  symptoms: { fontSize: 14, color: '#6b7280', marginTop: 8 },
});
