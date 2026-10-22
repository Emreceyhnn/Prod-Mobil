import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PrimaryButton from "./PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "Beklenmeyen bir hata oluştu."}
          </Text>
          <PrimaryButton title="Tekrar Dene" onPress={this.handleReset} style={{ marginTop: spacing.lg }} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.sm },
  message: { ...typography.bodyMd, color: colors.textSecondary, textAlign: "center" },
});
