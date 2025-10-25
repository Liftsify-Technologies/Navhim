import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: '#dbeafe', text: '#2563eb' };
      case 'completed': return { bg: '#d1fae5', text: '#059669' };
      case 'cancelled': return { bg: '#fee2e2', text: '#dc2626' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const handleJoinVideo = (zoomUrl: string) => {
    if (zoomUrl) {
      Linking.openURL(zoomUrl);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb', '#3b82f6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Appointments</Text>
            <Text style={styles.headerSubtitle}>{appointments.length} total bookings</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(patient)/book-appointment')} 
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {appointments.length > 0 ? (
          appointments.map((appointment) => {
            const statusColors = getStatusColor(appointment.status);
            const appointmentDate = new Date(appointment.appointment_datetime);
            const isPast = appointmentDate < new Date();

            return (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/(patient)/appointment-details?id=${appointment.id}`)}
              >
                <LinearGradient
                  colors={isPast ? ['#f8fafc', '#f1f5f9'] : ['#fff', '#fff']}
                  style={styles.cardGradient}
                >
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {appointment.status}
                    </Text>
                  </View>

                  {/* Doctor Info */}
                  <View style={styles.doctorSection}>
                    <LinearGradient
                      colors={['#dbeafe', '#bfdbfe']}
                      style={styles.doctorAvatar}
                    >
                      <Ionicons name="person" size={28} color="#2563eb" />
                    </LinearGradient>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>
                        Dr. {appointment.doctor_details?.first_name} {appointment.doctor_details?.last_name}
                      </Text>
                      <Text style={styles.specialization}>
                        {appointment.doctor_details?.specialization}
                      </Text>
                    </View>
                  </View>

                  {/* Appointment Details */}
                  <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar" size={18} color="#2563eb" />
                        <Text style={styles.detailLabel}>Date</Text>
                      </View>
                      <Text style={styles.detailValue}>
                        {appointmentDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="time" size={18} color="#2563eb" />
                        <Text style={styles.detailLabel}>Time</Text>
                      </View>
                      <Text style={styles.detailValue}>
                        {appointmentDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="videocam" size={18} color="#2563eb" />
                        <Text style={styles.detailLabel}>Type</Text>
                      </View>
                      <Text style={styles.detailValue}>
                        {appointment.appointment_type === 'video' ? 'Video Call' : 'In-Person'}
                      </Text>
                    </View>

                    {appointment.consultation_fee && (
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash" size={18} color="#059669" />
                          <Text style={styles.detailLabel}>Fee</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: '#059669', fontWeight: '600' }]}>
                          ₹{appointment.consultation_fee}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Symptoms */}
                  {appointment.symptoms && (
                    <View style={styles.symptomsSection}>
                      <Text style={styles.symptomsLabel}>Symptoms:</Text>
                      <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
                    </View>
                  )}

                  {/* Zoom Link Button */}
                  {appointment.appointment_type === 'video' && appointment.zoom_join_url && (
                    <TouchableOpacity
                      style={styles.videoButton}
                      onPress={() => handleJoinVideo(appointment.zoom_join_url)}
                    >
                      <LinearGradient
                        colors={['#2563eb', '#1e40af']}
                        style={styles.videoButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="videocam" size={20} color="#fff" />
                        <Text style={styles.videoButtonText}>Join Video Consultation</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Payment Status */}
                  {appointment.payment_status === 'completed' && (
                    <View style={styles.paymentStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={styles.paymentStatusText}>Payment Completed</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Appointments Yet</Text>
            <Text style={styles.emptyText}>Book your first consultation with our doctors</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(patient)/book-appointment')}
            >
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                style={styles.emptyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Book Appointment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#dbeafe' },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  scrollView: { flex: 1, padding: 16 },
  appointmentCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cardGradient: { padding: 20 },
  statusBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 1 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.5 },
  doctorSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  specialization: { fontSize: 14, color: '#64748b' },
  detailsSection: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  symptomsSection: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 16 },
  symptomsLabel: { fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  symptomsText: { fontSize: 14, color: '#78350f', lineHeight: 20 },
  videoButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  videoButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  videoButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  paymentStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  paymentStatusText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 24, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  emptyButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
