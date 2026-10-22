import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Çıkış Hatası", e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>E-posta</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </GlassCard>
        <PrimaryButton title="Çıkış Yap" onPress={handleSignOut} style={styles.signOutBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.md },
  card: { marginBottom: spacing.lg },
  label: { ...typography.labelCaps, color: colors.textSecondary, marginBottom: spacing.xs },
  value: { ...typography.bodyLg, color: colors.textPrimary },
  signOutBtn: { backgroundColor: colors.alertCoral },
});
