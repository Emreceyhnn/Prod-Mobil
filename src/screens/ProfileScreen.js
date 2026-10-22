import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import ReminderToggleRow from "../components/ReminderToggleRow";
import { colors, spacing, typography } from "../theme/colors";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelReminder,
  getReminderToggles,
  setReminderToggle,
  REMINDER_PRESETS,
} from "../services/reminderService";

const REMINDER_SCHEDULE = [
  { ...REMINDER_PRESETS.WATER, hour: 11, subtitle: "Her gün 11:00'de hatırlatılır" },
  { ...REMINDER_PRESETS.WEIGHT_CHECK, hour: 8, subtitle: "Her gün 08:00'de hatırlatılır" },
  { ...REMINDER_PRESETS.EXPENSE_REVIEW, hour: 21, subtitle: "Her gün 21:00'de hatırlatılır" },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [toggles, setToggles] = useState({});

  const loadToggles = useCallback(async () => {
    const data = await getReminderToggles();
    setToggles(data);
  }, []);

  useEffect(() => {
    loadToggles();
  }, [loadToggles]);

  const handleToggle = async (reminder, enabled) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Bildirim İzni Gerekli",
          "Hatırlatmaları alabilmek için ayarlardan bildirim iznini açmalısınız."
        );
        return;
      }
      await scheduleDailyReminder({
        identifier: reminder.identifier,
        title: reminder.title,
        body: reminder.body,
        hour: reminder.hour,
      });
    } else {
      await cancelReminder(reminder.identifier);
    }
    const next = await setReminderToggle(reminder.identifier, enabled);
    setToggles(next);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Çıkış Hatası", e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>E-posta</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Günlük Hatırlatıcılar</Text>
          {REMINDER_SCHEDULE.map((reminder) => (
            <ReminderToggleRow
              key={reminder.identifier}
              title={reminder.title}
              subtitle={reminder.subtitle}
              value={!!toggles[reminder.identifier]}
              onValueChange={(enabled) => handleToggle(reminder, enabled)}
            />
          ))}
        </GlassCard>

        <PrimaryButton title="Çıkış Yap" onPress={handleSignOut} style={styles.signOutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.md },
  card: { marginBottom: spacing.lg },
  label: { ...typography.labelCaps, color: colors.textSecondary, marginBottom: spacing.xs },
  value: { ...typography.bodyLg, color: colors.textPrimary },
  sectionTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm },
  signOutBtn: { backgroundColor: colors.alertCoral },
});
