import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getHistory } from '../services/api';

export default function HistoryScreen() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getHistory();
            setHistory(data);
        } catch (e) {
            Alert.alert("Error", "Could not load history.");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={styles.severity(item.severity)}>
                Severity: {item.severity === 2 ? 'Severe' : (item.severity === 1 ? 'Minor' : 'Unknown')}
            </Text>
            <Text>Location: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>

            {item.has_evidence && (
                <TouchableOpacity style={styles.evidenceBtn}>
                    <Text style={styles.evidenceBtnText}>View Encrypted Evidence</Text>
                </TouchableOpacity>
            )}
            {!item.has_evidence && <Text style={styles.noEvidence}>No Evidence Attached</Text>}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading history...</Text>
            ) : history.length === 0 ? (
                <Text>No incidents recorded yet.</Text>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    onRefresh={loadHistory}
                    refreshing={loading}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f8f9fa' },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
    time: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    severity: (level) => ({ color: level === 2 ? '#dc3545' : '#ffc107', fontWeight: 'bold', marginBottom: 5 }),
    evidenceBtn: { backgroundColor: '#198754', padding: 10, borderRadius: 5, marginTop: 10, alignItems: 'center' },
    evidenceBtnText: { color: 'white', fontWeight: 'bold' },
    noEvidence: { color: '#6c757d', fontStyle: 'italic', marginTop: 10 }
});
