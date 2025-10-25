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
import api from '../../services/api';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'in_person'>('video');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleBookAppointment = async () => {
    if (!appointmentDate || !appointmentTime) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/appointments/book', {
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        symptoms,
      });

      Alert.alert('Success', 'Appointment booked! Redirecting to payment...', [
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[styles.progressStep, step >= s && styles.progressStepActive]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Select Specialization</Text>
            <View style={styles.grid}>
              {specializations.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={styles.specializationCard}
                  onPress={() => handleSpecializationSelect(spec)}
                >
                  <Ionicons name="medical" size={32} color="#2563eb" />
                  <Text style={styles.specializationText}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Select Doctor</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#2563eb" />
            ) : (
              doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => handleDoctorSelect(doctor)}
                >
                  <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={32} color="#2563eb" />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </Text>
                    <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                    <Text style={styles.doctorExp}>{doctor.experience} years experience</Text>
                    <View style={styles.feeContainer}>
                      <Ionicons name="cash-outline" size={16} color="#059669" />
                      <Text style={styles.feeText}>₹{doctor.consultation_fee}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {step === 3 && selectedDoctor && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Appointment Details</Text>

            <View style={styles.selectedDoctorCard}>
              <View style={styles.doctorAvatar}>
                <Ionicons name="person" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.selectedDoctorName}>
                  Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                </Text>
                <Text style={styles.selectedDoctorSpec}>{selectedDoctor.specialization}</Text>
              </View>
            </View>

            <Text style={styles.label}>Appointment Type</Text>
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

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-12-15"
              value={appointmentDate}
              onChangeText={setAppointmentDate}
            />

            <Text style={styles.label}>Time (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="10:00"
              value={appointmentTime}
              onChangeText={setAppointmentTime}
            />

            <Text style={styles.label}>Symptoms (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your symptoms..."
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>Consultation Fee</Text>
              <Text style={styles.feeAmount}>₹{selectedDoctor.consultation_fee}</Text>
            </View>

            <TouchableOpacity
              style={[styles.bookButton, loading && styles.bookButtonDisabled]}
              onPress={handleBookAppointment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#2563eb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specializationCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  specializationText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  doctorSpec: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  doctorExp: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  feeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  selectedDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  selectedDoctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedDoctorSpec: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  typeTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
