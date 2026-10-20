import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

export interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  onPress,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.outerRing, (disabled || isLoading) && styles.disabledRing]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={styles.innerButton}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.accentCenterDot} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledRing: {
    opacity: 0.5,
  },
  innerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  accentCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    opacity: 0.85,
  },
});
