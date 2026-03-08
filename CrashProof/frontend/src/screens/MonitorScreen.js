import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import { Camera, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Platform } from 'react-native';
import { predictAccident, reportIncident } from '../services/api';

const isWeb = Platform.OS === 'web';

export default function MonitorScreen({ userId, onLogout }) {
    const [monitoring, setMonitoring] = useState(false);
    const [status, setStatus] = useState("Normal");

    // Sensors
    const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
    const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
    const [location, setLocation] = useState(null);

    // Permissions
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();
    const [locationPerm, setLocationPerm] = useState(null);

    // Camera & Recording
    const cameraRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [evidenceUri, setEvidenceUri] = useState(null);

    useEffect(() => {
        (async () => {
            if (isWeb) return; // Prevent Location crashing on Web
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            setLocationPerm(locStatus === 'granted');
            if (locStatus === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc.coords);
            }
        })();
    }, []);

    useEffect(() => {
        let accelSub, gyroSub;
        if (monitoring && !isWeb) { // Prevent Sensor crashing on Web
            accelSub = Accelerometer.addListener(setAccelData);
            Accelerometer.setUpdateInterval(500); // 500ms for battery saving in prototype

            gyroSub = Gyroscope.addListener(setGyroData);
            Gyroscope.setUpdateInterval(500);

            // Start background prediction loop
            const interval = setInterval(analyzeSensors, 2000);
            return () => {
                accelSub && accelSub.remove();
                gyroSub && gyroSub.remove();
                clearInterval(interval);
            };
        } else if (monitoring && isWeb) {
            const interval = setInterval(analyzeSensors, 2000);
            return () => clearInterval(interval);
        } else {
            if (!isWeb) {
                Accelerometer.removeAllListeners();
                Gyroscope.removeAllListeners();
            }
        }
    }, [monitoring, accelData, gyroData]);

    const analyzeSensors = async () => {
        // Feature extraction: [acc_x, acc_y, acc_z, gyro_rot, sound_intensity, impact_duration]
        // Mocking sound and duration for the hackathon prototype since expo-av audio levels are complex to setup
        const features = [
            accelData.x * 10, accelData.y * 10, accelData.z * 10, // Exaggerating for ML model
            Math.abs(gyroData.x) + Math.abs(gyroData.y) + Math.abs(gyroData.z),
            50, // mock sound
            0   // mock duration
        ];

        try {
            const result = await predictAccident(features);
            if (result.severity_level > 0) {
                handleAccident(result.severity_level);
            }
        } catch (e) {
            console.log("Prediction error:", e.message);
        }
    };

    const startRecording = async () => {
        if (cameraRef.current && !isRecording && cameraPermission?.granted && micPermission?.granted) {
            try {
                setIsRecording(true);
                const video = await cameraRef.current.recordAsync({ maxDuration: 10 }); // Record 10s clip
                setEvidenceUri(video.uri);
                return video.uri;
            } catch (e) {
                console.error("Recording error:", e);
                setIsRecording(false);
            }
        }
        return null;
    };

    const handleAccident = async (severity) => {
        setStatus(severity === 2 ? "SEVERE ACCIDENT" : "MINOR ACCIDENT");
        setMonitoring(false); // Stop normal monitoring to handle emergency

        Alert.alert(
            "Accident Detected!",
            "CrashProof has detected a potential accident. Recording evidence...",
            [{ text: "Cancel Alert", onPress: () => setStatus("Normal") }]
        );

        // 1. Record evidence
        const videoUri = await startRecording();

        // 2. Upload and report
        try {
            await reportIncident(
                userId,
                severity,
                location?.latitude,
                location?.longitude,
                videoUri
            );
            Alert.alert("Emergency Alert Sent", "Evidence has been securely uploaded and contacts notified.");
        } catch (e) {
            Alert.alert("Upload Failed", "Could not send evidence to server.");
        } finally {
            setIsRecording(false);
            setStatus("Normal");
        }
    };

    const simulateAccident = () => {
        // Force a prediction of severe accident by passing high values
        const highFeatures = [30, 30, 30, 500, 100, 2];
        predictAccident(highFeatures).then(result => {
            if (result.severity_level > 0) {
                handleAccident(result.severity_level);
            }
        });
    };

    if (!isWeb && (!cameraPermission?.granted || !micPermission?.granted)) {
        return (
            <View style={styles.center}>
                <Text>We need camera and mic permissions for recording evidence.</Text>
                <TouchableOpacity style={styles.btn} onPress={() => { requestCameraPermission(); requestMicPermission(); }}>
                    <Text style={styles.btnText}>Grant Permissions</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden camera view for recording evidence without taking up the whole screen */}
            {!isWeb && (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        mode="video"
                        facing="back"
                    />
                </View>
            )}

            <View style={styles.header}>
                <Text style={styles.title}>CrashProof</Text>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statusBox(status)}>
                <Text style={styles.statusTitle}>SYSTEM STATUS</Text>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            <View style={styles.sensorBox}>
                <Text style={styles.label}>Accelerometer</Text>
                <Text>X: {accelData.x.toFixed(2)} Y: {accelData.y.toFixed(2)} Z: {accelData.z.toFixed(2)}</Text>

                <Text style={styles.label}>Location</Text>
                <Text>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Locating..."}</Text>
            </View>

            <TouchableOpacity
                style={[styles.mainBtn, monitoring ? styles.btnStop : styles.btnStart]}
                onPress={() => setMonitoring(!monitoring)}
            >
                <Text style={styles.mainBtnText}>{monitoring ? "STOP MONITORING" : "START MONITORING"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.simBtn} onPress={simulateAccident}>
                <Text style={styles.mainBtnText}>SIMULATE ACCIDENT</Text>
            </TouchableOpacity>

            {isRecording && <Text style={{ color: 'red', marginTop: 10, alignSelf: 'center' }}>🔴 Recording Evidence...</Text>}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    cameraContainer: { height: 1, width: 1, overflow: 'hidden' }, // practically hidden
    camera: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '900', color: '#0d6efd', letterSpacing: -0.5 },
    logoutBtn: { backgroundColor: '#e9ecef', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    logoutText: { color: '#495057', fontWeight: 'bold' },
    statusBox: (status) => ({
        padding: 30,
        borderRadius: 20,
        backgroundColor: status === "Normal" ? '#ffffff' : '#FFE5E5',
        marginBottom: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10
    }),
    statusTitle: { fontSize: 13, fontWeight: '700', color: '#6c757d', marginBottom: 10, letterSpacing: 1 },
    statusText: { fontSize: 32, fontWeight: '900', color: status === "Normal" ? '#10b981' : '#ef4444' },
    sensorBox: { padding: 25, backgroundColor: 'white', borderRadius: 20, elevation: 4, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    label: { fontSize: 13, fontWeight: '700', marginTop: 10, color: '#adb5bd', textTransform: 'uppercase' },
    mainBtn: { padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    btnStart: { backgroundColor: '#0d6efd' },
    btnStop: { backgroundColor: '#dc3545' },
    mainBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    simBtn: { backgroundColor: '#ffc107', padding: 20, borderRadius: 10, alignItems: 'center' },
    btn: { backgroundColor: '#0d6efd', padding: 15, borderRadius: 8, marginTop: 15 },
    btnText: { color: 'white', fontWeight: 'bold' }
});
