import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, TouchableOpacity, Text, Alert, FlatList, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { useSession } from '@/Share/ctx';
import * as FileSystem from 'expo-file-system';
import { setStorageItemAsync } from '@/Share/useStorageState';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import * as SecureStore from 'expo-secure-store';
import { HelloWave } from '@/components/HelloWave';
import { Modal } from '@/components/Modal';

export default function App() {
  const [isModalVisible, setModalVisible] = useState(false);
  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = useState<string[]>([]);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const { signOut } = useSession();

  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  // Play a specific sound
  async function playSound(uri: string, index: number) {
    try {
      console.log("Loading sound from URI:", uri);
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setCurrentPlayingIndex(null);
      }
      else {
        setCurrentPlayingIndex(index);
        const { sound } = await Audio.Sound.createAsync({ uri });
        setCurrentSound(sound);
  
        // Start playing
        await sound.playAsync();
  
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            console.log("Playback finished, unloading sound...");
            setCurrentPlayingIndex(null); // Reset play status
            sound.unloadAsync();
            setCurrentSound(null);
          }
        });
      }
    } catch (error) {
      console.error("Error while playing sound:", error);
      setCurrentPlayingIndex(null); // Reset on error
      alert("Failed to play the sound.");
    }
  }

  // Start recording
  async function startRecording() {
    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        console.log('Requesting permission...');
        const response = await requestPermission();
        if (!response.granted) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Could not start recording.');
    }
  }

  // Delete a specific file from the device
  async function deleteSound(uri: string, index: number) {
    try {
      if(Platform.OS != "web") {
        // Delete the file from the filesystem
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      // Remove the file from the list
      setRecordings((prev) => prev.filter((_, i) => i !== index));
      saveRecordings(recordings);

      // Stop playback if the current sound is deleted
      if (index === currentPlayingIndex) {
        if (currentSound) {
          await currentSound.unloadAsync();
          setCurrentSound(null);
        }
        setCurrentPlayingIndex(null);
      }

      console.log("File deleted successfully.");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete the file.");
    }
  }

  async function stopRecording() {
    try {
      if (recording) {
        console.log('Stopping recording...');
        await recording.stopAndUnloadAsync();
  
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
  
        const uri = recording.getURI(); // Get the URI of the recorded file
        console.log('Recording stopped and stored at:', uri);
  
        if (Platform.OS === 'web') {
          // Fetch the file and create a Blob
          const response = await fetch(uri!);
          const blob = await response.blob();
  
          // Generate a download link
          const fileName = `recording_${Date.now()}.m4a`;
          const url = URL.createObjectURL(blob);
  
          // Trigger file download
          // const a = document.createElement('a');
          // a.href = url;
          // a.download = fileName;
          // document.body.appendChild(a);
          // a.click();
          // document.body.removeChild(a);
  
          console.log('Recording downloaded as:', fileName);
  
          // Add the Blob URL to recordings
          setRecordings((prev) => [...prev, uri!]);
        } else {
          // Native platforms: Move file to permanent storage
          const fileName = `recording_${Date.now()}.m4a`;
          const targetPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.moveAsync({
            from: uri!,
            to: targetPath,
          });
  
          console.log('File saved to disk at:', targetPath);
          setRecordings((prev) => [...prev, targetPath]);
        }
        Alert.alert(recordings.join(","));
        saveRecordings(recordings);
        setRecording(undefined); // Clear recording state
      } else {
        console.log('No recording to stop');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Could not stop recording.');
    }
  }
  
  async function saveRecordings(recordings : string[]) {
    try {
      if(Platform.OS === "web") {
        await localStorage.setItem('recordings', recordings.join(','));
      } else {
        await SecureStore.setItemAsync('recordings', recordings.join(','));
      }
      console.log('Recordings:', recordings);
      console.log('Recordings saved successfully.');
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  }
  
  async function loadRecordings() {
    try {
      Alert.alert(recordings.join(','));
      var recordingsString : String | null = "";
      if(Platform.OS === "web") {
        recordingsString = await localStorage.getItem('recordings');
      } else {
        recordingsString = await SecureStore.getItemAsync('recordings');
      }
      if (recordingsString) {
        setRecordings(recordingsString.split(','));
        console.log('Recordings loaded:', recordingsString.split(','));
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  }

  // Cleanup resources
  useEffect(() => {
    loadRecordings();

  },[]);

  return (
    <ThemedView style={styles.container}>
      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
      >
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </TouchableOpacity>

      {/* List of Recorded Files */}
      <FlatList
        data={recordings || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.listItem}>            
            <TouchableOpacity onPress={() => deleteSound(item, index)}>
              <ThemedText style={styles.listButton}>❌</ThemedText>
            </TouchableOpacity>

            <ThemedText type='default' style={styles.listText}>Recording {index + 1}</ThemedText>
            
            <TouchableOpacity onPress={() => playSound(item, index)}>
              <ThemedText style={styles.listButton}>{currentPlayingIndex === index ? "⏺" : "▶"}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      />
      <Button title='Refresh' onPress={loadRecordings}/>
      {/* Recording Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={recording ? stopRecording : startRecording}
      >
        <ThemedText style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</ThemedText>
      </TouchableOpacity>

      {isModalVisible && <Modal onClose={hideModal} content={recordings.join(",")} />}
    </ThemedView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  listText: {
    textAlign: 'left'
  },
  listButton: {
    fontSize: 20,
  }
});
