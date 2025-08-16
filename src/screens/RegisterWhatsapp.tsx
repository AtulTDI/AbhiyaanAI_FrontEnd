import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function RegisterWhatsapp() {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5202/api/WHChannel/requestqr?channelId=SHAZAM-XK9A8') // your backend API
      .then(res => res.json())
      .then(data => {
        try {
          //const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (data.base64) {
            setQrCode(data.base64);
            } else {
            console.warn('QR code not found in response:');
          }
        } catch (err) {
          console.error('Error parsing QR code:', err);
        }
      })
      .catch(err => console.error('API error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text>Generating QR Code...</Text>
      </View>
    );
  }

  if (!qrCode) {
    return (
      <View style={styles.center}>
        <Text>No QR code found. Please try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Scan this QR code with WhatsApp</Text>
      <Image
        source={{ uri: qrCode }}
        style={{ width: 250, height: 250 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold'
  }
});
