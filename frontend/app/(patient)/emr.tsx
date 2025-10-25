import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

export default function PatientEMRScreen() {
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'prescriptions'>('vitals');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vitalsRes, prescriptionsRes] = await Promise.all([
        api.get('/api/emr/vitals'),
        api.get('/api/emr/prescriptions'),
      ]);
      setVitals(vitalsRes.data.vitals || []);
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
    } catch (error) {
      console.error('Error loading EMR data:', error);
    } finally {
      setLoading(false);
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
            <Text style={styles.headerTitle}>Medical Records</Text>
            <Text style={styles.headerSubtitle}>Your health history</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="medical" size={24} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'vitals' && styles.tabActive]} 
          onPress={() => setActiveTab('vitals')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'vitals' ? '#2563eb' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'vitals' && styles.tabTextActive]}>
            Vitals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'prescriptions' && styles.tabActive]} 
          onPress={() => setActiveTab('prescriptions')}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={activeTab === 'prescriptions' ? '#2563eb' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.tabTextActive]}>
            Prescriptions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'vitals' && (
          <>
            {vitals.length > 0 ? (
              vitals.map((vital, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar" size={16} color="#2563eb" />
                      <Text style={styles.cardDate}>
                        {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.vitalsGrid}>
                    {vital.blood_pressure_systolic && (
                      <View style={styles.vitalItem}>
                        <View style={styles.vitalIconContainer}>
                          <Ionicons name="pulse" size={24} color="#ef4444" />
                        </View>
                        <Text style={styles.vitalLabel}>Blood Pressure</Text>
                        <Text style={styles.vitalValue}>
                          {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                        </Text>
                        <Text style={styles.vitalUnit}>mmHg</Text>
                      </View>
                    )}
                    {vital.heart_rate && (
                      <View style={styles.vitalItem}>
                        <View style={styles.vitalIconContainer}>
                          <Ionicons name="heart" size={24} color="#ef4444" />
                        </View>
                        <Text style={styles.vitalLabel}>Heart Rate</Text>
                        <Text style={styles.vitalValue}>{vital.heart_rate}</Text>
                        <Text style={styles.vitalUnit}>bpm</Text>
                      </View>
                    )}
                    {vital.temperature && (
                      <View style={styles.vitalItem}>
                        <View style={styles.vitalIconContainer}>
                          <Ionicons name="thermometer" size={24} color="#f59e0b" />
                        </View>
                        <Text style={styles.vitalLabel}>Temperature</Text>
                        <Text style={styles.vitalValue}>{vital.temperature}</Text>
                        <Text style={styles.vitalUnit}>°C</Text>
                      </View>
                    )}
                    {vital.weight && (
                      <View style={styles.vitalItem}>
                        <View style={styles.vitalIconContainer}>
                          <Ionicons name="fitness" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.vitalLabel}>Weight</Text>
                        <Text style={styles.vitalValue}>{vital.weight}</Text>
                        <Text style={styles.vitalUnit}>kg</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={80} color="#e5e7eb" />
                <Text style={styles.emptyTitle}>No Vitals Recorded</Text>
                <Text style={styles.emptyText}>
                  Your vital signs will appear here after your doctor's consultations
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'prescriptions' && (
          <>
            {prescriptions.length > 0 ? (
              prescriptions.map((presc, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.prescriptionHeader}>
                    <LinearGradient
                      colors={['#dbeafe', '#bfdbfe']}
                      style={styles.doctorAvatarSmall}
                    >
                      <Ionicons name="person" size={20} color="#2563eb" />
                    </LinearGradient>
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.doctorName}>
                        Dr. {presc.doctor_details?.first_name} {presc.doctor_details?.last_name}
                      </Text>
                      <View style={styles.dateContainer}>
                        <Ionicons name="calendar" size={14} color="#6b7280" />
                        <Text style={styles.prescriptionDate}>
                          {new Date(presc.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.diagnosisContainer}>
                    <Text style={styles.diagnosisLabel}>Diagnosis</Text>
                    <Text style={styles.diagnosisText}>{presc.diagnosis}</Text>
                  </View>

                  <View style={styles.medicationsContainer}>
                    <Text style={styles.medicationsTitle}>Medications</Text>
                    {presc.medications.map((med: any, idx: number) => (
                      <View key={idx} style={styles.medicationItem}>
                        <View style={styles.medicationHeader}>
                          <Ionicons name="medical" size={18} color="#2563eb" />
                          <Text style={styles.medicationName}>{med.name}</Text>
                        </View>
                        <Text style={styles.medicationDetails}>
                          {med.dosage} • {med.frequency}
                        </Text>
                        {med.duration && (
                          <Text style={styles.medicationDuration}>
                            Duration: {med.duration}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {presc.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes</Text>
                      <Text style={styles.notesText}>{presc.notes}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={80} color="#e5e7eb" />
                <Text style={styles.emptyTitle}>No Prescriptions</Text>
                <Text style={styles.emptyText}>
                  Your prescriptions from consultations will appear here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, padding: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#2563eb' },
  scrollView: { flex: 1 },
  card: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  cardDate: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#2563eb', marginBottom: 8 },
  diagnosis: { fontSize: 14, color: '#1f2937', marginBottom: 12 },
  vitalText: { fontSize: 16, color: '#1f2937', marginBottom: 8 },
  medicationsContainer: { marginTop: 12 },
  medicationItem: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 8 },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  medicationDetails: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
