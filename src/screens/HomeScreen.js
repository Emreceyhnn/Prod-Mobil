import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase, toFriendlyDbError } from "../services/supabase";
import GlassCard from "../components/GlassCard";
import { colors, spacing, typography, radius } from "../theme/colors";

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [netBalance, setNetBalance] = useState(0);
  const [latestWeight, setLatestWeight] = useState(null);
  const [latestSteps, setLatestSteps] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const { data: expenses, error: expError } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id);
      if (expError) throw expError;
      const total = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
      setNetBalance(total);

      const { data: weightRows, error: weightError } = await supabase
        .from("health_metrics")
        .select("value, unit, recorded_at")
        .eq("user_id", user.id)
        .eq("metric_type", "weight")
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (weightError) throw weightError;
      setLatestWeight(weightRows?.[0] ?? null);

      const { data: stepRows, error: stepError } = await supabase
        .from("health_metrics")
        .select("value, unit, recorded_at")
        .eq("user_id", user.id)
        .eq("metric_type", "steps")
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (stepError) throw stepError;
      setLatestSteps(stepRows?.[0] ?? null);
    } catch (e) {
      Alert.alert("Veri Yüklenemedi", toFriendlyDbError(e).message);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.greeting}>Merhaba 👋</Text>
        <Text style={styles.subGreeting}>Tüm yaşam metriklerin senkronize çalışıyor.</Text>

        <View style={styles.grid}>
          <GlassCard style={styles.gridItem}>
            <Text style={styles.cardLabel}>NET BAKİYE</Text>
            <Text style={styles.metricValue}>₺{netBalance.toFixed(2)}</Text>
          </GlassCard>

          <GlassCard style={styles.gridItem}>
            <Text style={styles.cardLabel}>GÜNCEL TARTI</Text>
            <Text style={styles.metricValue}>
              {latestWeight ? `${(Math.round(latestWeight.value * 10) / 10).toFixed(1)} ${latestWeight.unit}` : "—"}
            </Text>
          </GlassCard>
        </View>

        <View style={styles.grid}>
          <GlassCard style={styles.gridItem}>
            <Text style={styles.cardLabel}>GÜNLÜK ADIM</Text>
            <Text style={styles.metricValue}>
              {latestSteps ? Math.round(latestSteps.value) : "—"}
            </Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.insightCard}>
          <Text style={styles.insightTitle}>Vela AI Önerisi</Text>
          <Text style={styles.insightBody}>
            AI Asistan sekmesinden kendi agent endpoint'inizi tanımlayarak kişisel
            önerileri görüntüleyebilirsiniz.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  greeting: { ...typography.headlineMd, color: colors.textPrimary },
  subGreeding: {},
  subGreeting: { ...typography.bodyMd, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  grid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  gridItem: { flex: 1 },
  cardLabel: { ...typography.labelCaps, color: colors.metricCyan, marginBottom: spacing.xs },
  metricValue: { ...typography.metricVal, color: colors.textPrimary },
  insightCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderGlow,
  },
  insightTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.xs },
  insightBody: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 20 },
});
