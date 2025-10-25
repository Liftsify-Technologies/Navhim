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
                    {index === 0 && (
                      <View style={styles.latestBadge}>
                        <Text style={styles.latestBadgeText}>Latest</Text>
                      </View>
                    )}
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
  headerGradient: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#dbeafe' },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#2563eb' },
  scrollView: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', marginBottom: 16, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardHeader: { marginBottom: 16 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDate: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vitalItem: { width: '47%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, alignItems: 'center' },
  vitalIconContainer: { marginBottom: 8 },
  vitalLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, textAlign: 'center' },
  vitalValue: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  vitalUnit: { fontSize: 12, color: '#94a3b8' },
  prescriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  doctorAvatarSmall: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  prescriptionInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  prescriptionDate: { fontSize: 13, color: '#6b7280', marginLeft: 4 },
  diagnosisContainer: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 16 },
  diagnosisLabel: { fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  diagnosisText: { fontSize: 14, color: '#78350f' },
  medicationsContainer: { marginBottom: 12 },
  medicationsTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  medicationItem: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#2563eb' },
  medicationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  medicationName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  medicationDetails: { fontSize: 14, color: '#475569', marginLeft: 26 },
  medicationDuration: { fontSize: 13, color: '#64748b', marginLeft: 26, marginTop: 4 },
  notesContainer: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginTop: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontSize: 14, color: '#1e293b' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 24, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
