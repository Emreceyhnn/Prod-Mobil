import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing, typography } from "../theme/colors";

export default function PrimaryButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.agentViolet,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.agentViolet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.textPrimary,
    ...typography.labelMd,
    fontWeight: "700",
    fontSize: 15,
  },
});
