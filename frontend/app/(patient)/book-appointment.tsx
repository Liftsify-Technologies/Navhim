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

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  ];

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/appointments/book', {
        doctor_id: selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: appointmentType,
        symptoms,
      });

      Alert.alert('Success', 'Appointment booked successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(patient)/appointments'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.progressItem}>
              <View style={[styles.progressDot, step >= s && styles.progressDotActive]}>
                {step > s ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={styles.progressNumber}>{s}</Text>
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
                onDayPress={(day) => handleDateSelect(day.dateString)}
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
                <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
                <View style={styles.timeSlotsGrid}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotActive,
                      ]}
                      onPress={() => handleTimeSelect(time)}
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
                  <Text style={styles.summaryTitle}>Appointment Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date</Text>
                    <Text style={styles.summaryValue}>
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Time</Text>
                    <Text style={styles.summaryValue}>{selectedTime}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Consultation Fee</Text>
                    <Text style={[styles.summaryValue, styles.summaryFee]}>
                      ₹{selectedDoctor.consultation_fee}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.bookButton, loading && styles.bookButtonDisabled]}
                  onPress={handleBookAppointment}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1e40af']}
                    style={styles.bookButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.bookButtonText}>Confirm Booking</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
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
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  progressDotActive: { backgroundColor: '#fff' },
  progressNumber: { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 4 },
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
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  timeSlot: { width: '22%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  timeSlotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  timeSlotText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  timeSlotTextActive: { color: '#fff' },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12, marginTop: 8 },
  typeContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 8, borderWidth: 2, borderColor: 'transparent' },
  typeButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  typeTextActive: { color: '#fff' },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 16, color: '#1e293b', minHeight: 100, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  summaryCard: { backgroundColor: '#f0fdf4', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#bbf7d0' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#166534', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#166534' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#166534' },
  summaryFee: { fontSize: 18, color: '#059669' },
  bookButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 8 },
  bookButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});