import { Slot } from 'expo-router';
import { SessionProvider } from '../Share/ctx';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

export default function Root() {
  return (
    <SessionProvider>
      <StatusBar style="auto" hidden={false} />
      <ThemedView style={styles.container}>
        <Slot />
      </ThemedView>
    </SessionProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
  }
});