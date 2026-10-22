import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "E-posta ve şifre alanlarını doldurun.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert("Giriş Başarısız", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Vela</Text>
        <Text style={styles.subtitle}>Günlük Asistanınıza Hoş Geldiniz</Text>

        <View style={styles.form}>
          <TextField
            placeholder="E-posta"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            placeholder="Şifre"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <PrimaryButton title="Giriş Yap" onPress={handleLogin} loading={loading} />

          <Text style={styles.link} onPress={() => navigation.navigate("SignUp")}>
            Hesabınız yok mu? <Text style={styles.linkBold}>Kayıt Olun</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceBase },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.displayHeroMobile,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.sm,
  },
  link: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: "700",
  },
});
