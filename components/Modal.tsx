import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';

interface ModalProps {
  onClose: () => void;
  content: string;
}

export function Modal({ onClose, content }: ModalProps) {
  return (
    <ThemedView style={styles.modalStyles}>
      <View style={styles.modalContentStyles}>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonStyles}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <Text>{content}</Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    modalStyles : {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    },

    modalContentStyles : {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 4,
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
    },

    closeButtonStyles : {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    borderRadius: 50,
    padding: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    },

    closeButtonText : {
    color: 'white',
    fontWeight: 'bold',
    },
});
