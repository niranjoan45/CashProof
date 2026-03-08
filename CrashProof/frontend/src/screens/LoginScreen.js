import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { loginUser } from '../services/api';

export default function LoginScreen({ navigation, setUserId }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            if (Platform.OS === 'web') {
                window.alert('Error: Please fill in all fields');
            } else {
                Alert.alert('Error', 'Please fill in all fields');
            }
            return;
        }

        setLoading(true);
        try {
            const data = await loginUser(email, password);
            if (data.user_id) {
                setUserId(data.user_id); // Pass state up to App.js to switch navigators
            } else {
                if (Platform.OS === 'web') {
                    window.alert('Error: Invalid credentials');
                } else {
                    Alert.alert('Error', 'Invalid credentials');
                }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Could not connect to server.';
            if (Platform.OS === 'web') {
                window.alert(`Login Failed: ${errorMsg}`);
            } else {
                Alert.alert('Login Failed', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Text style={styles.logo}>CrashProof</Text>
                    <Text style={styles.subtitle}>Welcome back. Sign in to your account.</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.mainBtn}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.mainBtnText}>SIGN IN</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { flex: 1, padding: 30, justifyContent: 'center' },
    headerContainer: { marginBottom: 40, alignItems: 'center' },
    logo: { fontSize: 36, fontWeight: '900', color: '#0d6efd', marginBottom: 10, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
    form: { backgroundColor: 'white', padding: 25, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#495057', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
    mainBtn: { backgroundColor: '#0d6efd', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    linkBtn: { marginTop: 25, alignItems: 'center' },
    linkText: { color: '#6c757d', fontSize: 14 },
    linkHighlight: { color: '#0d6efd', fontWeight: 'bold' }
});
