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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'vitals' && styles.tabActive]} onPress={() => setActiveTab('vitals')}>
          <Text style={[styles.tabText, activeTab === 'vitals' && styles.tabTextActive]}>Vitals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'prescriptions' && styles.tabActive]} onPress={() => setActiveTab('prescriptions')}>
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.tabTextActive]}>Prescriptions</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {activeTab === 'vitals' && vitals.map((vital, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardDate}>{new Date(vital.recorded_at).toLocaleDateString()}</Text>
            {vital.blood_pressure_systolic && <Text style={styles.vitalText}>BP: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</Text>}
            {vital.heart_rate && <Text style={styles.vitalText}>Heart Rate: {vital.heart_rate} bpm</Text>}
            {vital.temperature && <Text style={styles.vitalText}>Temperature: {vital.temperature}°C</Text>}
            {vital.weight && <Text style={styles.vitalText}>Weight: {vital.weight} kg</Text>}
          </View>
        ))}
        {activeTab === 'prescriptions' && prescriptions.map((presc, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>Prescription</Text>
            <Text style={styles.cardDate}>{new Date(presc.created_at).toLocaleDateString()}</Text>
            <Text style={styles.doctorName}>Dr. {presc.doctor_details?.first_name} {presc.doctor_details?.last_name}</Text>
            <Text style={styles.diagnosis}>Diagnosis: {presc.diagnosis}</Text>
            <View style={styles.medicationsContainer}>
              {presc.medications.map((med: any, idx: number) => (
                <View key={idx} style={styles.medicationItem}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDetails}>{med.dosage} - {med.frequency}</Text>
                </View>
              ))}
            </View>
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
