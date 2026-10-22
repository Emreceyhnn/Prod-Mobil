import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import TextField from "./TextField";
import PrimaryButton from "./PrimaryButton";
import { colors, spacing, typography, radius } from "../theme/colors";

const CATEGORIES = [
  "Market & Restoran",
  "Ulaşım & Yakıt",
  "Konut & Faturalar",
  "Yazılım & Abonelikler",
  "Kişisel & Eğlence",
  "Sağlık",
  "Diğer",
];

export default function AddExpenseModal({ visible, onClose, onSubmit }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType("expense");
    setAmount("");
    setMerchant("");
    setCategory(CATEGORIES[0]);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!parsedAmount || Number.isNaN(parsedAmount)) {
      Alert.alert("Geçersiz Tutar", "Lütfen geçerli bir tutar girin.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        amount: type === "income" ? Math.abs(parsedAmount) : -Math.abs(parsedAmount),
        type,
        merchant: merchant.trim() || (type === "income" ? "Gelir" : "Harcama"),
        category: type === "income" ? "Gelir" : category,
        source: "manual",
      });
      reset();
      onClose();
    } catch (e) {
      Alert.alert("Hata", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Kayıt</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, type === "expense" && styles.typeButtonActiveExpense]}
              onPress={() => setType("expense")}
            >
              <Text style={[styles.typeButtonText, type === "expense" && styles.typeButtonTextActive]}>
                Harcama
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === "income" && styles.typeButtonActiveIncome]}
              onPress={() => setType("income")}
            >
              <Text style={[styles.typeButtonText, type === "income" && styles.typeButtonTextActive]}>
                Gelir
              </Text>
            </TouchableOpacity>
          </View>

          <TextField
            placeholder="Tutar (₺)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextField
            placeholder={type === "income" ? "Kaynak (opsiyonel)" : "İşyeri (opsiyonel)"}
            value={merchant}
            onChangeText={setMerchant}
          />

          {type === "expense" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
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
            </ScrollView>
          )}

          <PrimaryButton title="Kaydet" onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
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
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
  },
  typeButtonActiveExpense: { backgroundColor: colors.alertCoral },
  typeButtonActiveIncome: { backgroundColor: colors.metricEmerald },
  typeButtonText: { ...typography.labelMd, color: colors.textSecondary, fontWeight: "600" },
  typeButtonTextActive: { color: colors.textPrimary },
  categoryScroll: { marginBottom: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    marginRight: spacing.xs,
  },
  categoryChipActive: { backgroundColor: colors.primaryContainer },
  categoryChipText: { ...typography.bodySm, color: colors.textSecondary },
  categoryChipTextActive: { color: colors.textPrimary, fontWeight: "600" },
});
