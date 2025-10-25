import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Doctor specific fields
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');
  
  const router = useRouter();
  const { register, loading } = useAuthStore();

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !phone) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      if (role === 'doctor') {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      if (!specialization || !qualifications || !experience || !consultationFee) {
        Alert.alert('Error', 'Please complete your professional information');
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!dateOfBirth || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const userData: any = {
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
      };

      await register(userData);
      
      // If doctor, update profile with professional details
      if (role === 'doctor') {
        // TODO: Call API to update doctor profile
        // This will be handled after registration
      }
      
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb', '#3b82f6']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
                {role === 'doctor' && <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />}
                <View style={[styles.progressDot, step === 3 && styles.progressDotActive]} />
              </View>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {step === 1 && (
                <>
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>Join NAVHIM Healthcare today</Text>

                  <Text style={styles.sectionLabel}>I am a</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                      onPress={() => setRole('patient')}
                    >
                      <Ionicons name="person" size={28} color={role === 'patient' ? '#fff' : '#2563eb'} />
                      <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>Patient</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
                      onPress={() => setRole('doctor')}
                    >
                      <Ionicons name="medical" size={28} color={role === 'doctor' ? '#fff' : '#2563eb'} />
                      <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>Doctor</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Ionicons name="person-outline" size={20} color="#2563eb" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="mail" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                      colors={['#2563eb', '#1e40af']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>Next</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 2 && role === 'doctor' && (
                <>
                  <Text style={styles.title}>Professional Details</Text>
                  <Text style={styles.subtitle}>Help patients know about you</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="medical" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Specialization (e.g., Cardiologist)"
                      value={specialization}
                      onChangeText={setSpecialization}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="school" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Qualifications (e.g., MBBS, MD)"
                      value={qualifications}
                      onChangeText={setQualifications}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Ionicons name="time" size={20} color="#2563eb" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Experience (years)"
                        value={experience}
                        onChangeText={setExperience}
                        keyboardType="numeric"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Ionicons name="cash" size={20} color="#2563eb" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Fee (₹)"
                        value={consultationFee}
                        onChangeText={setConsultationFee}
                        keyboardType="numeric"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <Ionicons name="document-text" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Brief bio about yourself..."
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                      colors={['#2563eb', '#1e40af']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 3 && (
                <>
                  <Text style={styles.title}>Complete Setup</Text>
                  <Text style={styles.subtitle}>Just a few more details</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Date of Birth (YYYY-MM-DD)"
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <Text style={styles.sectionLabel}>Gender</Text>
                  <View style={styles.genderContainer}>
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                        onPress={() => setGender(g)}
                      >
                        <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password (min 6 characters)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed" size={20} color="#2563eb" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.nextButton, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#2563eb', '#1e40af']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Create Account</Text>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  progressDotActive: { backgroundColor: '#fff', width: 24 },
  formContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 500, marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 12, marginTop: 8 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleButton: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent' },
  roleButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  roleTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56 },
  textAreaContainer: { height: 120, alignItems: 'flex-start', paddingVertical: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },
  textArea: { textAlignVertical: 'top', paddingTop: 0 },
  eyeIcon: { padding: 4 },
  genderContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  genderButton: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  genderButtonActive: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  genderText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  genderTextActive: { color: '#2563eb' },
  nextButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: '#64748b' },
  loginLinkBold: { color: '#2563eb', fontWeight: '600' },
});
