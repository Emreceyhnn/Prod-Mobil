import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase, toFriendlyDbError } from "../services/supabase";
import GlassCard from "../components/GlassCard";
import AddExpenseModal from "../components/AddExpenseModal";
import QuickButtonEditorModal from "../components/QuickButtonEditorModal";
import { colors, spacing, typography, radius } from "../theme/colors";
import { getQuickButtons } from "../services/quickExpenseService";

export default function FinanceScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [quickButtons, setQuickButtons] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [savingQuickId, setSavingQuickId] = useState(null);

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      Alert.alert("Hata", toFriendlyDbError(error).message);
      return;
    }
    setExpenses(data || []);
  }, [user]);

  const loadQuickButtons = useCallback(async () => {
    const buttons = await getQuickButtons();
    setQuickButtons(buttons);
  }, []);

  useEffect(() => {
    loadExpenses();
    loadQuickButtons();
  }, [loadExpenses, loadQuickButtons]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), loadQuickButtons()]);
    setRefreshing(false);
  };

  const insertExpense = async (payload) => {
    if (!user) return;
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: payload.amount,
      category: payload.category,
      merchant: payload.merchant,
      source: payload.source,
      raw_text: payload.raw_text || null,
      created_at: new Date().toISOString(),
    });
    if (error) throw toFriendlyDbError(error);
    await loadExpenses();
  };

  const handleQuickButtonPress = async (button) => {
    setSavingQuickId(button.id);
    try {
      await insertExpense({
        amount: -Math.abs(button.amount),
        category: button.category,
        merchant: button.label,
        source: "quick_button",
      });
    } catch (e) {
      Alert.alert("Hata", e.message);
    } finally {
      setSavingQuickId(null);
    }
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
            <View style={styles.headerRow}>
              <Text style={styles.title}>Finans</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
                <Text style={styles.addButtonText}>+ Yeni Ekle</Text>
              </TouchableOpacity>
            </View>

            <GlassCard style={styles.totalCard}>
              <View style={styles.quickHeader}>
                <Text style={styles.quickTitle}>⚡ Hızlı Butonlarım</Text>
                <TouchableOpacity onPress={() => setEditorModalVisible(true)}>
                  <Text style={styles.quickEdit}>+ Ekle / Düzenle</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quickGrid}>
                {quickButtons.map((btn) => (
                  <TouchableOpacity
                    key={btn.id}
                    style={styles.quickButton}
                    onPress={() => handleQuickButtonPress(btn)}
                    disabled={savingQuickId === btn.id}
                  >
                    <Text style={styles.quickEmoji}>{btn.emoji}</Text>
                    <Text style={styles.quickLabel}>{btn.label}</Text>
                    <Text style={styles.quickAmount}>
                      {savingQuickId === btn.id ? "..." : `₺${btn.amount}`}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.quickButtonAdd} onPress={() => setEditorModalVisible(true)}>
                  <Text style={styles.quickAddPlus}>+</Text>
                  <Text style={styles.quickAddLabel}>Yeni Ekle</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

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

      <AddExpenseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={insertExpense}
      />
      <QuickButtonEditorModal
        visible={editorModalVisible}
        onClose={() => setEditorModalVisible(false)}
        onChanged={loadQuickButtons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  addButton: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addButtonText: { ...typography.labelMd, color: colors.textPrimary, fontWeight: "700" },
  totalCard: { marginBottom: spacing.md },
  quickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quickTitle: { ...typography.labelCaps, color: colors.alertAmber, letterSpacing: 0.5 },
  quickEdit: { ...typography.bodySm, color: colors.primary },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickButton: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  quickEmoji: { fontSize: 22, marginBottom: 4 },
  quickLabel: { ...typography.bodySm, color: colors.textPrimary, textAlign: "center" },
  quickAmount: { ...typography.labelMd, color: colors.secondary, fontWeight: "700", marginTop: 2 },
  quickButtonAdd: {
    flexBasis: "30%",
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderGlass,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  quickAddPlus: { ...typography.headlineSm, color: colors.secondary },
  quickAddLabel: { ...typography.bodySm, color: colors.textSecondary },
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
