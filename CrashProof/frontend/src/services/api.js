import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2 to access the host machine's localhost
// For iOS simulator or web, use localhost or your machine's local IP address
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

// For physical device testing, you should replace this with your computer's local network IP address (e.g., 192.168.1.X)
// const BASE_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

export const checkStatus = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    console.error("Backend status check failed:", error.message);
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error.response?.data?.error || error.message);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data?.error || error.message);
    throw error;
  }
};

export const predictAccident = async (features) => {
  try {
    const response = await api.post('/predict', { features });
    return response.data; // { severity_level: 0/1/2, severity_desc: "Normal" }
  } catch (error) {
    console.error("Prediction failed:", error.message);
    throw error;
  }
};

export const reportIncident = async (userId, severity, latitude, longitude, videoUri) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('severity', severity);
    if (latitude && longitude) {
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
    }

    if (videoUri) {
      // Create a file object from URI
      const filename = videoUri.split('/').pop() || 'evidence.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : `video/mp4`;

      formData.append('evidence_file', { uri: videoUri, name: filename, type });
    }

    const response = await api.post('/report_incident', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Incident reporting failed:", error.message);
    throw error;
  }
};

export const getHistory = async (userId) => {
  try {
    const response = await api.get(`/history?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch history:", error.message);
    throw error;
  }
};
