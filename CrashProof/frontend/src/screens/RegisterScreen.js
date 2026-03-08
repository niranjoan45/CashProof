import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { registerUser } from '../services/api';

export default function RegisterScreen({ navigation, setUserId }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const data = await registerUser(name, email, password);
            if (data.user_id) {
                if (Platform.OS === 'web') {
                    window.alert('Success: Account created! Please sign in with your new credentials.');
                } else {
                    Alert.alert('Success', 'Account created! Please sign in.');
                }
                navigation.navigate('Login'); // Redirect to Login instead of auto-logging in
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Could not connect to server.';
            if (Platform.OS === 'web') {
                window.alert(`Registration Failed: ${errorMsg}`);
            } else {
                Alert.alert('Registration Failed', errorMsg);
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
                    <Text style={styles.logo}>Create Account</Text>
                    <Text style={styles.subtitle}>Join CrashProof to securely track and store your evidence.</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />

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
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.mainBtnText}>REGISTER</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
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
    logo: { fontSize: 32, fontWeight: '900', color: '#212529', marginBottom: 10, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center', lineHeight: 22 },
    form: { backgroundColor: 'white', padding: 25, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#495057', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
    mainBtn: { backgroundColor: '#0d6efd', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    linkBtn: { marginTop: 25, alignItems: 'center' },
    linkText: { color: '#6c757d', fontSize: 14 },
    linkHighlight: { color: '#0d6efd', fontWeight: 'bold' }
});
