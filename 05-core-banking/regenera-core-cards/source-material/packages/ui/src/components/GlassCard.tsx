import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'holographic';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  onPress,
  variant = 'default' 
}) => {
  const Container = onPress ? TouchableOpacity : View;
  
  const baseStyle = variant === 'holographic' ? styles.holographic : styles.default;

  return (
    <Container 
      style={[styles.card, baseStyle, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  holographic: {
    backgroundColor: 'rgba(58, 102, 255, 0.1)',
    borderColor: 'rgba(58, 102, 255, 0.3)',
  }
});
