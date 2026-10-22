import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { colors, spacing, typography } from "../theme/colors";

const CHART_HEIGHT = 80;
const CHART_WIDTH = 300;
const PADDING = 10;

export default function TrendChart({ title, data, unit, color = colors.metricCyan }) {
  if (!data || data.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>Henüz yeterli veri yok (en az 2 kayıt gerekli).</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = PADDING + (i / (data.length - 1)) * (CHART_WIDTH - PADDING * 2);
    const y = PADDING + (1 - (d.value - min) / range) * (CHART_HEIGHT - PADDING * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const last = data[data.length - 1];
  const first = data[0];
  const delta = last.value - first.value;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.delta, { color: delta >= 0 ? colors.metricEmerald : colors.alertCoral }]}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} {unit}
        </Text>
      </View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Line
          x1={PADDING}
          y1={CHART_HEIGHT - PADDING}
          x2={CHART_WIDTH - PADDING}
          y2={CHART_HEIGHT - PADDING}
          stroke={colors.borderGlass}
          strokeWidth={1}
        />
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill={color} />
        ))}
      </Svg>
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>{first.date.slice(5)}</Text>
        <Text style={styles.labelTextLast}>
          {last.date.slice(5)} ({last.value.toFixed(1)} {unit})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: { ...typography.labelMd, color: colors.textPrimary, fontWeight: "600" },
  delta: { ...typography.labelCaps },
  empty: { ...typography.bodySm, color: colors.textSecondary },
  labelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  labelText: { ...typography.bodySm, color: colors.textSecondary, fontSize: 10 },
  labelTextLast: { ...typography.bodySm, color: colors.textSecondary, fontSize: 10, fontWeight: "600" },
});
