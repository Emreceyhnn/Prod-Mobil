import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import GlassCard from "../components/GlassCard";
import { colors, spacing, typography, radius } from "../theme/colors";

export default function FinanceScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      Alert.alert("Hata", error.message);
      return;
    }
    setExpenses(data || []);
  }, [user]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Finans</Text>
            <GlassCard style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOPLAM HARCAMA</Text>
              <Text style={styles.totalValue}>₺{total.toFixed(2)}</Text>
            </GlassCard>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.merchant}>{item.merchant || "İşlem"}</Text>
              <Text style={styles.category}>{item.category} • {item.source}</Text>
            </View>
            <Text style={styles.amount}>-₺{Number(item.amount).toFixed(2)}</Text>
          </GlassCard>
        )}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz işlem kaydı yok.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.md },
  totalCard: { marginBottom: spacing.md },
  totalLabel: { ...typography.labelCaps, color: colors.metricCyan, marginBottom: spacing.xs },
  totalValue: { ...typography.displayHeroMobile, color: colors.textPrimary },
  sectionTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowLeft: { flex: 1 },
  merchant: { ...typography.labelMd, color: colors.textPrimary, fontWeight: "600" },
  category: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  amount: { ...typography.headlineSm, color: colors.alertCoral },
  empty: { ...typography.bodyMd, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
