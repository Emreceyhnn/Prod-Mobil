import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

export default function TextField(props) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "rgba(9, 13, 22, 0.6)",
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
});
