import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import api from '../../services/api';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'in_person'>('video');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

  const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  ];

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return allTimeSlots;
    
    const today = new Date();
    const selected = new Date(selectedDate);
    
    // If selected date is not today, return all slots
    if (selected.toDateString() !== today.toDateString()) {
      return allTimeSlots;
    }
    
    // Filter out past time slots for today
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    return allTimeSlots.filter(slot => {
      const [hour, minute] = slot.split(':').map(Number);
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute) return true;
      return false;
    });
  };

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      const response = await api.get('/api/specializations');
      setSpecializations(response.data.specializations);
    } catch (error) {
      console.error('Error loading specializations:', error);
    }
  };

  const loadDoctors = async (spec: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/doctors/list?specialization=${spec}`);
      setDoctors(response.data.doctors);
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationSelect = (spec: string) => {
    setSelectedSpecialization(spec);
    loadDoctors(spec);
    setStep(2);
  };

  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setStep(3);
  };

  const handleProceedToPayment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      // Book the appointment
      const bookingResponse = await api.post('/api/appointments/book', {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        symptoms,
      });

      const createdAppointmentId = bookingResponse.data.id;
      setAppointmentId(createdAppointmentId);
      
      setLoading(false);
      // Navigate to dummy payment screen
      router.push({
        pathname: '/(patient)/payment-confirm',
        params: {
          appointmentId: createdAppointmentId,
          amount: selectedDoctor.consultation_fee,
          doctorName: `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
        },
      });

    } catch (error: any) {
      setLoading(false);
      console.error('Booking error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create appointment. Please try again.');
    }
  };

  const handleJoinVideoCall = () => {
    if (appointmentDetails?.zoom_join_url) {
      Linking.openURL(appointmentDetails.zoom_join_url);
    } else {
      Alert.alert('Info', 'Video call link will be available closer to appointment time');
    }
  };

  if (showConfirmation && appointmentDetails) {
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
                Dr. {appointmentDetails.doctor_details?.first_name} {appointmentDetails.doctor_details?.last_name}
              </Text>

              <View style={styles.confirmationRow}>
                <Ionicons name="calendar" size={20} color="#2563eb" />
                <Text style={styles.confirmationLabel}>Date & Time</Text>
              </View>
              <Text style={styles.confirmationValue}>
                {new Date(appointmentDetails.appointment_datetime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.confirmationValue}>
                {new Date(appointmentDetails.appointment_datetime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              <View style={styles.confirmationRow}>
                <Ionicons name="videocam" size={20} color="#2563eb" />
                <Text style={styles.confirmationLabel}>Type</Text>
              </View>
              <Text style={styles.confirmationValue}>{appointmentDetails.appointment_type}</Text>

              {appointmentDetails.zoom_join_url && (
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
              onPress={() => router.replace('/(patient)/home')}
            >
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
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
          <TouchableOpacity 
            onPress={() => step > 1 ? setStep(step - 1) : router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Book Appointment</Text>
            <Text style={styles.headerSubtitle}>
              {step === 1 && 'Select Specialization'}
              {step === 2 && 'Choose Doctor'}
              {step === 3 && 'Date & Time'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.progressItem}>
              <View style={[styles.progressDot, step >= s && styles.progressDotActive]}>
                {step > s ? (
                  <Ionicons name="checkmark" size={16} color="#2563eb" />
                ) : (
                  <Text style={[styles.progressNumber, step >= s && styles.progressNumberActive]}>
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Select Specialization</Text>
            <Text style={styles.stepSubtitle}>Choose your medical concern</Text>
            
            <View style={styles.specializationsGrid}>
              {specializations.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={styles.specializationCard}
                  onPress={() => handleSpecializationSelect(spec)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#f0f9ff', '#e0f2fe']}
                    style={styles.specializationGradient}
                  >
                    <View style={styles.specializationIcon}>
                      <Ionicons name="medical" size={28} color="#2563eb" />
                    </View>
                    <Text style={styles.specializationText}>{spec}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Select Doctor</Text>
            <Text style={styles.stepSubtitle}>{selectedSpecialization}</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
            ) : (
              doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => handleDoctorSelect(doctor)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#dbeafe', '#bfdbfe']}
                    style={styles.doctorAvatar}
                  >
                    <Ionicons name="person" size={32} color="#2563eb" />
                  </LinearGradient>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </Text>
                    <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                    <View style={styles.doctorMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.metaText}>{doctor.rating || '4.5'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{doctor.experience} yrs</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={14} color="#059669" />
                        <Text style={[styles.metaText, { color: '#059669', fontWeight: '600' }]}>
                          ₹{doctor.consultation_fee}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {step === 3 && selectedDoctor && (
          <View style={styles.content}>
            <View style={styles.selectedDoctorBanner}>
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                style={styles.selectedDoctorGradient}
              >
                <LinearGradient
                  colors={['#dbeafe', '#bfdbfe']}
                  style={styles.selectedDoctorAvatar}
                >
                  <Ionicons name="person" size={24} color="#2563eb" />
                </LinearGradient>
                <View>
                  <Text style={styles.selectedDoctorName}>
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </Text>
                  <Text style={styles.selectedDoctorSpec}>{selectedDoctor.specialization}</Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.stepTitle}>Select Date & Time</Text>
            
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setSelectedTime(''); // Reset time when date changes
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: '#2563eb',
                  },
                }}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  todayTextColor: '#2563eb',
                  selectedDayBackgroundColor: '#2563eb',
                  selectedDayTextColor: '#fff',
                  arrowColor: '#2563eb',
                  monthTextColor: '#1f2937',
                  textMonthFontWeight: '700',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                }}
              />
            </View>

            {selectedDate && (
              <>
                <Text style={styles.timeSlotsTitle}>
                  Available Time Slots
                  {selectedDate === new Date().toISOString().split('T')[0] && (
                    <Text style={styles.timeSlotsNote}> (Today)</Text>
                  )}
                </Text>
                <View style={styles.timeSlotsGrid}>
                  {getAvailableTimeSlots().map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotActive,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.timeSlotTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {getAvailableTimeSlots().length === 0 && (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="time-outline" size={48} color="#9ca3af" />
                    <Text style={styles.noSlotsText}>No more slots available today</Text>
                    <Text style={styles.noSlotsSubtext}>Please select another date</Text>
                  </View>
                )}

                {selectedTime && (
                  <>
                    <Text style={styles.sectionLabel}>Appointment Type</Text>
                    <View style={styles.typeContainer}>
                      <TouchableOpacity
                        style={[styles.typeButton, appointmentType === 'video' && styles.typeButtonActive]}
                        onPress={() => setAppointmentType('video')}
                      >
                        <Ionicons
                          name="videocam"
                          size={20}
                          color={appointmentType === 'video' ? '#fff' : '#2563eb'}
                        />
                        <Text style={[styles.typeText, appointmentType === 'video' && styles.typeTextActive]}>
                          Video Call
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, appointmentType === 'in_person' && styles.typeButtonActive]}
                        onPress={() => setAppointmentType('in_person')}
                      >
                        <Ionicons
                          name="location"
                          size={20}
                          color={appointmentType === 'in_person' ? '#fff' : '#2563eb'}
                        />
                        <Text style={[styles.typeText, appointmentType === 'in_person' && styles.typeTextActive]}>
                          In-Person
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionLabel}>Symptoms (Optional)</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Describe your symptoms..."
                      value={symptoms}
                      onChangeText={setSymptoms}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor="#94a3b8"
                    />

                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryTitle}>Payment Summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Consultation Fee</Text>
                        <Text style={styles.summaryValue}>₹{selectedDoctor.consultation_fee}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryTotal}>Total Amount</Text>
                        <Text style={[styles.summaryValue, styles.summaryTotalValue]}>
                          ₹{selectedDoctor.consultation_fee}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
                      onPress={handleProceedToPayment}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        style={styles.paymentButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="card" size={24} color="#fff" />
                            <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.securePayment}>
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                      <Text style={styles.securePaymentText}>Secure payment via Razorpay</Text>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerGradient: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#dbeafe', marginTop: 2, letterSpacing: 0.3 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 12 },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  progressDotActive: { backgroundColor: '#fff', borderColor: '#fff' },
  progressNumber: { fontSize: 15, fontWeight: '700', color: '#fff' },
  progressNumberActive: { color: '#2563eb' },
  progressLine: { flex: 1, height: 3, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  stepTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  specializationsGrid: { gap: 12 },
  specializationCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  specializationGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  specializationIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  specializationText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b' },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  doctorAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  doctorSpec: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  doctorMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  selectedDoctorBanner: { marginBottom: 24, borderRadius: 20, overflow: 'hidden', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  selectedDoctorGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  selectedDoctorAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  selectedDoctorName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  selectedDoctorSpec: { fontSize: 14, color: '#dbeafe' },
  calendarContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  timeSlotsTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  timeSlotsNote: { fontSize: 14, color: '#f59e0b', fontWeight: '600' },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  timeSlot: { width: '22%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  timeSlotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  timeSlotText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  timeSlotTextActive: { color: '#fff' },
  noSlotsContainer: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 24 },
  noSlotsText: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 },
  noSlotsSubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12, marginTop: 8 },
  typeContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8, borderWidth: 2, borderColor: 'transparent' },
  typeButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  typeTextActive: { color: '#fff' },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 16, color: '#1e293b', minHeight: 100, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#64748b' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  summaryDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  summaryTotal: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  summaryTotalValue: { fontSize: 22, color: '#059669' },
  paymentButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 12 },
  paymentButtonDisabled: { opacity: 0.6 },
  paymentButtonGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  paymentButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  securePayment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  securePaymentText: { fontSize: 13, color: '#059669', fontWeight: '500' },
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