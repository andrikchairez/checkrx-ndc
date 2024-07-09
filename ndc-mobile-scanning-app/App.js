import React, { useState, useRef } from 'react';
import { View, Button, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import BottomSheet from 'react-native-simple-bottom-sheet';

export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const sendBase64ToServer = async (base64String) => {
    try {
      const response = await fetch('https://us-central1-checkrx-agent-app.cloudfunctions.net/processDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encodedImage: base64String,
          mimeType: 'image/png'
        }),
      });
      
      const apiResult = await response.json();
      return apiResult;
    } catch (error) {
      throw new Error("Failed to process document");
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setLoading(true);
      setBottomSheetVisible(true);
      setError(null);
      setResult(null);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true });
        const apiResult = await sendBase64ToServer(photo.base64);
        setResult(apiResult);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <BottomSheet
        isOpen={bottomSheetVisible}
        sliderMinHeight={0}
        sliderMaxHeight={300}
        onClose={() => setBottomSheetVisible(true)}
      >
        <View style={styles.bottomSheetContent}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.text}>Scanning...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
            </View>
          )}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Prescription Name: {apiResult.medicationName}</Text>
              <Text style={styles.resultText}>RXCUI: {apiResult.rxcui}</Text>
            </View>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingBottom: 65,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  bottomSheetContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    marginVertical: 5,
  },
});
