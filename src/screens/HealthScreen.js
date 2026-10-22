import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import TrendChart from "../components/TrendChart";
import { colors, spacing, typography } from "../theme/colors";
import {
  initHealthKit,
  syncAllHealthData,
  fetchCurrentHealthSnapshot,
  fetchHealthMetricHistory,
} from "../services/healthService";
import { useBluetoothDevices } from "../services/bluetoothService";

function MetricTile({ label, value, unit }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value != null ? Math.round(value * 10) / 10 : "—"}
        {value != null && unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const TREND_METRICS = [
  { key: "weight", label: "Kilo Trendi", unit: "kg", color: colors.metricCyan },
  { key: "body_fat", label: "Yağ Oranı Trendi", unit: "%", color: colors.agentViolet },
  { key: "bmi", label: "BMI Trendi", unit: "", color: colors.alertAmber },
  { key: "lean_body_mass", label: "Yağsız Vücut Kütlesi Trendi", unit: "kg", color: colors.metricEmerald },
  { key: "steps", label: "Adım Trendi", unit: "adım", color: colors.secondary },
  { key: "active_energy", label: "Yakılan Kalori Trendi", unit: "kcal", color: colors.alertCoral },
];

export default function HealthScreen() {
  const { user } = useAuth();
  const [healthKitReady, setHealthKitReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState({
    weight: null,
    steps: null,
    activeEnergy: null,
    bodyFat: null,
    bmi: null,
    height: null,
    leanBodyMass: null,
    distance: null,
    heartRate: null,
  });
  const [trendData, setTrendData] = useState({});

  const {
    devices,
    scanning,
    connectedDevice,
    error: bleError,
    startScan,
    connectToDevice,
  } = useBluetoothDevices();

  const loadSnapshot = useCallback(async () => {
    if (Platform.OS !== "ios") return;
    try {
      const data = await fetchCurrentHealthSnapshot();
      setSnapshot(data);
    } catch (e) {
      // Sessizce geç — izinler henüz verilmemiş olabilir
    }
  }, []);

  const loadTrends = useCallback(async () => {
    if (!user) return;
    try {
      const entries = await Promise.all(
        TREND_METRICS.map(async (m) => {
          const history = await fetchHealthMetricHistory(user.id, m.key, 14);
          return [m.key, history];
        })
      );
      setTrendData(Object.fromEntries(entries));
    } catch (e) {
      // sessiz geç
    }
  }, [user]);

  useEffect(() => {
    if (Platform.OS === "ios") {
      initHealthKit()
        .then(() => {
          setHealthKitReady(true);
          loadSnapshot();
        })
        .catch((e) => Alert.alert("HealthKit Hatası", e.message));
    }
  }, [loadSnapshot]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await syncAllHealthData(user.id);
      await Promise.all([loadSnapshot(), loadTrends()]);
      if (result.errors.length > 0) {
        Alert.alert("Kısmen Tamamlandı", result.errors.join("\n"));
      }
    } catch (e) {
      Alert.alert("Senkronizasyon Hatası", e.message);
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSnapshot(), loadTrends()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Sağlık</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Günlük Vitaller</Text>
          <Text style={styles.cardBody}>
            Durum: {Platform.OS === "ios" ? (healthKitReady ? "Apple Health Bağlı" : "Bağlanıyor...") : "Yalnızca iOS"}
          </Text>

          <View style={styles.grid}>
            <MetricTile label="Adım" value={snapshot.steps} unit="" />
            <MetricTile label="Mesafe" value={snapshot.distance} unit="km" />
            <MetricTile label="Yakılan Kalori" value={snapshot.activeEnergy} unit="kcal" />
            <MetricTile label="Kilo" value={snapshot.weight} unit="kg" />
            <MetricTile label="Boy" value={snapshot.height} unit="cm" />
            <MetricTile label="BMI" value={snapshot.bmi} unit="" />
            <MetricTile label="Yağ Oranı" value={snapshot.bodyFat} unit="%" />
            <MetricTile label="Yağsız Kütle" value={snapshot.leanBodyMass} unit="kg" />
            <MetricTile label="Nabız" value={snapshot.heartRate} unit="bpm" />
          </View>

          <PrimaryButton
            title="Şimdi Senkronize Et"
            onPress={handleSync}
            loading={syncing}
            disabled={Platform.OS !== "ios"}
            style={{ marginTop: spacing.md }}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Trendler (Son 14 Gün)</Text>
          {TREND_METRICS.map((m) => (
            <TrendChart
              key={m.key}
              title={m.label}
              unit={m.unit}
              color={m.color}
              data={trendData[m.key]}
            />
          ))}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Bluetooth Cihazları</Text>
          <Text style={styles.cardBody}>
            {connectedDevice ? `Bağlı: ${connectedDevice.name}` : "Bağlı cihaz yok"}
          </Text>
          <PrimaryButton
            title={scanning ? "Taranıyor..." : "Cihazları Tara"}
            onPress={startScan}
            loading={scanning}
            style={{ marginTop: spacing.sm }}
          />
          {bleError && <Text style={styles.errorText}>{bleError}</Text>}
          {devices.map((d) => (
            <Text
              key={d.id}
              style={styles.deviceItem}
              onPress={() => connectToDevice(d.id)}
            >
              {d.name} — bağlanmak için dokunun
            </Text>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.xs },
  cardBody: { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { ...typography.bodySm, color: colors.alertCoral, marginTop: spacing.xs },
  deviceItem: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricTile: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: "center",
  },
  metricLabel: { ...typography.labelCaps, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { ...typography.headlineSm, color: colors.textPrimary },
  metricUnit: { ...typography.bodySm, color: colors.textSecondary, fontWeight: "400" },
});
