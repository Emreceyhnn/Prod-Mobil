import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { colors, spacing, typography } from "../theme/colors";

export default function ReminderToggleRow({ title, subtitle, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.agentViolet }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  textContainer: { flex: 1, paddingRight: spacing.sm },
  title: { ...typography.labelMd, color: colors.textPrimary, fontWeight: "600" },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
});
