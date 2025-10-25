import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAppointmentDetails();
    }
  }, [id]);

  const loadAppointmentDetails = async () => {
    try {
      const response = await api.get(`/api/appointments/${id}`);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinVideo = () => {
    if (appointment?.zoom_join_url) {
      Linking.openURL(appointment.zoom_join_url);
    } else {
      Alert.alert('Info', 'Video call link will be available closer to appointment time');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return { bg: '#dbeafe', text: '#2563eb', icon: 'calendar' };
      case 'completed': return { bg: '#d1fae5', text: '#059669', icon: 'checkmark-circle' };
      case 'cancelled': return { bg: '#fee2e2', text: '#dc2626', icon: 'close-circle' };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: 'time' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Appointment not found</Text>
      </View>
    );
  }

  const statusColors = getStatusColor(appointment.status);
  const appointmentDate = new Date(appointment.appointment_datetime);
  const isPast = appointmentDate < new Date();
  const isUpcoming = !isPast && appointment.status === 'scheduled';

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
            <Text style={styles.headerTitle}>Appointment Details</Text>
            <Text style={styles.headerSubtitle}>
              {appointment.status === 'scheduled' ? 'Scheduled' : appointment.status}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Ionicons name={statusColors.icon as any} size={20} color={statusColors.text} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {appointment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Doctor Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doctor Information</Text>
          <View style={styles.doctorSection}>
            <LinearGradient
              colors={['#dbeafe', '#bfdbfe']}
              style={styles.doctorAvatar}
            >
              <Ionicons name="person" size={36} color="#2563eb" />
            </LinearGradient>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                Dr. {appointment.doctor_details?.first_name} {appointment.doctor_details?.last_name}
              </Text>
              <Text style={styles.specialization}>
                {appointment.doctor_details?.specialization}
              </Text>
              {appointment.doctor_details?.experience && (
                <View style={styles.experienceTag}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.experienceText}>
                    {appointment.doctor_details.experience} years experience
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color="#2563eb" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {appointmentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color="#2563eb" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {appointmentDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons 
                name={appointment.appointment_type === 'video' ? 'videocam' : 'location'} 
                size={20} 
                color="#2563eb" 
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {appointment.appointment_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="cash" size={20} color="#059669" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Consultation Fee</Text>
              <Text style={[styles.detailValue, { color: '#059669', fontWeight: '700' }]}>
                ₹{appointment.consultation_fee || appointment.doctor_details?.consultation_fee || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Symptoms Card */}
        {appointment.symptoms && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Symptoms</Text>
            <View style={styles.symptomsContainer}>
              <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
            </View>
          </View>
        )}

        {/* Video Call Card */}
        {appointment.appointment_type === 'video' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Video Consultation</Text>
            
            {appointment.zoom_join_url ? (
              <>
                <View style={styles.videoInfoContainer}>
                  <Ionicons name="videocam" size={48} color="#2563eb" />
                  <Text style={styles.videoInfoText}>
                    {isUpcoming 
                      ? 'Your video consultation link is ready!' 
                      : 'Video consultation details'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.videoButton}
                  onPress={handleJoinVideo}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1e40af']}
                    style={styles.videoButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="videocam" size={24} color="#fff" />
                    <Text style={styles.videoButtonText}>Join Video Call</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {appointment.zoom_meeting_id && (
                  <View style={styles.meetingIdContainer}>
                    <Text style={styles.meetingIdLabel}>Meeting ID:</Text>
                    <Text style={styles.meetingIdValue}>{appointment.zoom_meeting_id}</Text>
                  </View>
                )}

                {appointment.zoom_password && (
                  <View style={styles.meetingIdContainer}>
                    <Text style={styles.meetingIdLabel}>Password:</Text>
                    <Text style={styles.meetingIdValue}>{appointment.zoom_password}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noVideoContainer}>
                <Ionicons name="information-circle" size={32} color="#94a3b8" />
                <Text style={styles.noVideoText}>
                  Video link will be available after payment confirmation
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <View style={styles.paymentStatusContainer}>
            <Ionicons 
              name={appointment.payment_status === 'completed' ? 'checkmark-circle' : 'time'} 
              size={24} 
              color={appointment.payment_status === 'completed' ? '#059669' : '#f59e0b'} 
            />
            <Text style={[
              styles.paymentStatusText,
              { color: appointment.payment_status === 'completed' ? '#059669' : '#f59e0b' }
            ]}>
              {appointment.payment_status === 'completed' ? 'Payment Completed' : 'Payment Pending'}
            </Text>
          </View>
          {appointment.payment_id && (
            <Text style={styles.paymentId}>Payment ID: {appointment.payment_id}</Text>
          )}
        </View>

        {/* Booking ID */}
        <View style={styles.bookingIdContainer}>
          <Text style={styles.bookingIdLabel}>Booking ID</Text>
          <Text style={styles.bookingIdValue}>{appointment.id}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerGradient: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#dbeafe', marginTop: 2, letterSpacing: 0.3 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 16 },
  statusContainer: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 8 },
  statusText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  doctorSection: { flexDirection: 'row', alignItems: 'center' },
  doctorAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  specialization: { fontSize: 15, color: '#64748b', marginBottom: 8 },
  experienceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  experienceText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#1e293b', fontWeight: '600' },
  symptomsContainer: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 16 },
  symptomsText: { fontSize: 15, color: '#78350f', lineHeight: 22 },
  videoInfoContainer: { alignItems: 'center', marginBottom: 20 },
  videoInfoText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 12 },
  videoButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  videoButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  videoButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  meetingIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 },
  meetingIdLabel: { fontSize: 14, color: '#64748b', fontWeight: '500', marginRight: 8 },
  meetingIdValue: { fontSize: 14, color: '#1e293b', fontWeight: '600', flex: 1 },
  noVideoContainer: { alignItems: 'center', paddingVertical: 24 },
  noVideoText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 12 },
  paymentStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  paymentStatusText: { fontSize: 16, fontWeight: '700' },
  paymentId: { fontSize: 13, color: '#64748b', marginTop: 8, fontFamily: 'monospace' },
  bookingIdContainer: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center' },
  bookingIdLabel: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingIdValue: { fontSize: 16, color: '#1e293b', fontWeight: '700', fontFamily: 'monospace' },
});
