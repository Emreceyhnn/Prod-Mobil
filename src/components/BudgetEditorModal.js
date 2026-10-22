import React, { useCallback, useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from "react-native";
import TextField from "./TextField";
import PrimaryButton from "./PrimaryButton";
import { colors, spacing, typography, radius } from "../theme/colors";
import { getBudgets, setBudget, removeBudget } from "../services/budgetService";

const CATEGORIES = [
  "Market & Restoran",
  "Ulaşım & Yakıt",
  "Konut & Faturalar",
  "Yazılım & Abonelikler",
  "Kişisel & Eğlence",
  "Sağlık",
  "Diğer",
];

export default function BudgetEditorModal({ visible, userId, onClose, onChanged }) {
  const [budgets, setBudgets] = useState({});
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const data = await getBudgets(userId);
    setBudgets(data);
  }, [userId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleSave = async () => {
    const parsedLimit = parseFloat(limit.replace(",", "."));
    if (!parsedLimit || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      Alert.alert("Geçersiz Limit", "Lütfen geçerli bir aylık limit girin.");
      return;
    }
    setSaving(true);
    try {
      const next = await setBudget(userId, category, parsedLimit);
      setBudgets(next);
      setLimit("");
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (cat) => {
    const next = await removeBudget(userId, cat);
    setBudgets(next);
    onChanged?.();
  };

  const entries = Object.entries(budgets);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Bütçe Hedefleri</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={entries}
            keyExtractor={([cat]) => cat}
            style={{ maxHeight: 160 }}
            renderItem={({ item: [cat, amount] }) => (
              <View style={styles.existingRow}>
                <Text style={styles.existingText}>
                  {cat} — ₺{amount}/ay
                </Text>
                <TouchableOpacity onPress={() => handleRemove(cat)}>
                  <Text style={styles.removeText}>Sil</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Henüz bütçe hedefi yok.</Text>}
          />

          <View style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextField
            placeholder="Aylık limit (₺)"
            keyboardType="decimal-pad"
            value={limit}
            onChangeText={setLimit}
          />

          <PrimaryButton title="Limit Kaydet" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  closeText: { ...typography.labelMd, color: colors.textSecondary },
  existingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  existingText: { ...typography.bodyMd, color: colors.onSurface },
  removeText: { ...typography.bodySm, color: colors.alertCoral },
  empty: { ...typography.bodySm, color: colors.textSecondary, paddingVertical: spacing.sm },
  categoryScroll: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginVertical: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  categoryChipActive: { backgroundColor: colors.primaryContainer },
  categoryChipText: { ...typography.bodySm, color: colors.textSecondary },
  categoryChipTextActive: { color: colors.textPrimary, fontWeight: "600" },
});
