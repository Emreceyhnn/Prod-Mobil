import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { colors, spacing, typography } from "../theme/colors";

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
      .limit(100);
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

  const { income, outcome, net, categoryTotals } = useMemo(() => {
    let income = 0;
    let outcome = 0;
    const categoryTotals = {};

    for (const item of expenses) {
      const amount = Number(item.amount);
      if (amount >= 0) {
        income += amount;
      } else {
        outcome += Math.abs(amount);
        const cat = item.category || "Diğer";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(amount);
      }
    }

    return { income, outcome, net: income - outcome, categoryTotals };
  }, [expenses]);

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Finans</Text>

            <GlassCard style={styles.totalCard}>
              <Text style={styles.totalLabel}>NET BAKİYE</Text>
              <Text style={styles.totalValue}>₺{net.toFixed(2)}</Text>
              <View style={styles.splitRow}>
                <View style={styles.splitItem}>
                  <Text style={styles.splitLabel}>Girişler</Text>
                  <Text style={[styles.splitValue, { color: colors.metricEmerald }]}>
                    +₺{income.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.splitItem}>
                  <Text style={styles.splitLabel}>Çıkışlar</Text>
                  <Text style={[styles.splitValue, { color: colors.alertCoral }]}>
                    -₺{outcome.toFixed(2)}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {topCategories.length > 0 && (
              <GlassCard style={styles.totalCard}>
                <Text style={styles.sectionTitle}>Kategoriye Göre Harcama</Text>
                {topCategories.map(([cat, amount]) => (
                  <View key={cat} style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>{cat}</Text>
                    <Text style={styles.categoryAmount}>₺{amount.toFixed(2)}</Text>
                  </View>
                ))}
              </GlassCard>
            )}

            <Text style={styles.sectionTitle}>Son İşlemler</Text>
          </View>
        }
        renderItem={({ item }) => {
          const amount = Number(item.amount);
          const isIncome = amount >= 0;
          return (
            <GlassCard style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.merchant}>{item.merchant || "İşlem"}</Text>
                <Text style={styles.category}>
                  {item.category} • {item.source}
                </Text>
              </View>
              <Text style={[styles.amount, { color: isIncome ? colors.metricEmerald : colors.alertCoral }]}>
                {isIncome ? "+" : "-"}₺{Math.abs(amount).toFixed(2)}
              </Text>
            </GlassCard>
          );
        }}
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
  totalValue: { ...typography.displayHeroMobile, color: colors.textPrimary, marginBottom: spacing.sm },
  splitRow: { flexDirection: "row", gap: spacing.md },
  splitItem: { flex: 1 },
  splitLabel: { ...typography.labelCaps, color: colors.textSecondary, marginBottom: 2 },
  splitValue: { ...typography.headlineSm },
  sectionTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  categoryLabel: { ...typography.bodyMd, color: colors.onSurface },
  categoryAmount: { ...typography.labelMd, color: colors.textPrimary, fontWeight: "600" },
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
  amount: { ...typography.headlineSm },
  empty: { ...typography.bodyMd, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
