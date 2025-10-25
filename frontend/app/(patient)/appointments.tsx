import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function PatientAppointmentsScreen() {
  const router = useRouter();
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
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity onPress={() => router.push('/(patient)/book-appointment')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.doctorAvatar}>
                <Ionicons name="person" size={24} color="#2563eb" />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>Dr. {appointment.doctor_details?.first_name} {appointment.doctor_details?.last_name}</Text>
                <Text style={styles.specialization}>{appointment.doctor_details?.specialization}</Text>
              </View>
              <View style={[styles.statusBadge, {backgroundColor: appointment.status === 'scheduled' ? '#dbeafe' : '#fef3c7'}]}>
                <Text style={[styles.statusText, {color: appointment.status === 'scheduled' ? '#2563eb' : '#f59e0b'}]}>{appointment.status}</Text>
              </View>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{new Date(appointment.appointment_datetime).toLocaleDateString()}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{new Date(appointment.appointment_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
            {appointment.zoom_join_url && (
              <TouchableOpacity style={styles.joinButton} onPress={() => {}}>
                <Ionicons name="videocam" size={20} color="#fff" />
                <Text style={styles.joinButtonText}>Join Video Call</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  appointmentCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  specialization: { fontSize: 14, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  detailText: { fontSize: 14, color: '#6b7280' },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', padding: 12, borderRadius: 12, marginTop: 12, gap: 8 },
  joinButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
