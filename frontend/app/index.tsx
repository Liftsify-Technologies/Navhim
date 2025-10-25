import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'patient') {
      return <Redirect href="/(patient)/home" />;
    } else if (user.role === 'doctor') {
      return <Redirect href="/(doctor)/home" />;
    }
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
