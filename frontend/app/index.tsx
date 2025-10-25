import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        if (user.role === 'patient') {
          router.replace('/(patient)/home');
        } else if (user.role === 'doctor') {
          router.replace('/(doctor)/home');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
