import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function PatientProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const menuItems = [
    { id: 'personal', title: 'Personal Information', icon: 'person-outline', onPress: () => {} },
    { id: 'medical', title: 'Medical History', icon: 'medical-outline', onPress: () => {} },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', onPress: () => {} },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
    { id: 'logout', title: 'Logout', icon: 'log-out-outline', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#2563eb" />
          </View>
          <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Patient</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={24} color={item.danger ? '#dc2626' : '#6b7280'} />
                <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  profileHeader: { backgroundColor: '#fff', padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  badge: { backgroundColor: '#dbeafe', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  menuContainer: { marginTop: 16, paddingBottom: 0 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTitle: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  menuTitleDanger: { color: '#dc2626' },
});
