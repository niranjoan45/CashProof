import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactsScreen() {
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const saved = await AsyncStorage.getItem('@contacts');
            if (saved) setContacts(JSON.parse(saved));
        } catch (e) {
            console.log('Failed to load contacts');
        }
    };

    const saveContacts = async (newContacts) => {
        try {
            await AsyncStorage.setItem('@contacts', JSON.stringify(newContacts));
            setContacts(newContacts);
        } catch (e) {
            Alert.alert('Error saving contact');
        }
    };

    const addContact = () => {
        if (!name || !phone) {
            Alert.alert('Required', 'Please enter both name and phone number.');
            return;
        }

        const newContact = { id: Date.now().toString(), name, phone };
        saveContacts([...contacts, newContact]);
        setName('');
        setPhone('');
    };

    const deleteContact = (id) => {
        saveContacts(contacts.filter(c => c.id !== id));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Emergency Contacts</Text>
            <Text style={styles.sub}>These contacts will be notified automatically if a severe accident is detected.</Text>

            <View style={styles.addForm}>
                <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Phone Number" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
                <TouchableOpacity style={styles.addBtn} onPress={addContact}>
                    <Text style={styles.addBtnText}>ADD CONTACT</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={contacts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.contactCard}>
                        <View>
                            <Text style={styles.cName}>{item.name}</Text>
                            <Text style={styles.cPhone}>{item.phone}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteContact(item.id)}>
                            <Text style={styles.delBtn}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    sub: { color: '#6c757d', marginBottom: 20 },
    addForm: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
    input: { borderBottomWidth: 1, borderBottomColor: '#dee2e6', paddingVertical: 10, marginBottom: 15 },
    addBtn: { backgroundColor: '#0d6efd', padding: 15, borderRadius: 5, alignItems: 'center' },
    addBtnText: { color: 'white', fontWeight: 'bold' },
    contactCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 5, marginBottom: 10, elevation: 1 },
    cName: { fontWeight: 'bold', fontSize: 16 },
    cPhone: { color: '#6c757d' },
    delBtn: { color: '#dc3545', fontWeight: 'bold' }
});
