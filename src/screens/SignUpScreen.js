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

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "E-posta ve şifre alanlarını doldurun.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Şifre Uyuşmuyor", "Girdiğiniz şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        "Kayıt Başarılı",
        "E-posta adresinize doğrulama bağlantısı gönderildi (varsa), ardından giriş yapabilirsiniz."
      );
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Kayıt Başarısız", e.message);
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
        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>Yaşam metriklerinizi senkronize etmeye başlayın</Text>

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
          <TextField
            placeholder="Şifre (Tekrar)"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <PrimaryButton title="Kayıt Ol" onPress={handleSignUp} loading={loading} />

          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            Zaten hesabınız var mı? <Text style={styles.linkBold}>Giriş Yapın</Text>
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
