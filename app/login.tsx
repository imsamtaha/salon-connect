import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const { refresh } = useAuth({ autoFetch: false });
  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isArabic = language === "ar";
  const busy = login.isPending || register.isPending;

  async function completeSession() {
    await refresh();
    router.replace("/");
  }

  async function handleSubmit() {
    try {
      if (mode === "register") {
        await register.mutateAsync({ name: name.trim() || email.split("@")[0], email: email.trim(), password });
      } else {
        await login.mutateAsync({ email: email.trim(), password });
      }
      await completeSession();
    } catch (error) {
      Alert.alert(isArabic ? "تعذر الدخول" : "Sign-in failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function handleDemo(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("demo1234");
    try {
      await login.mutateAsync({ email: nextEmail, password: "demo1234" });
      await completeSession();
    } catch (error) {
      Alert.alert(isArabic ? "تعذر الدخول التجريبي" : "Demo sign-in failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  return (
    <ScreenContainer className="px-6 pt-8" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={styles.markText}>BC</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>BEAUTY CONNECT</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {mode === "register"
            ? (isArabic ? "أنشئي حساب العميلة" : "Create a customer account")
            : (isArabic ? "سجّلي دخولك لمتابعة مواعيدك" : "Sign in to manage appointments")}
        </Text>
        {mode === "register" ? (
          <TextInput value={name} onChangeText={setName} placeholder={isArabic ? "الاسم" : "Name"} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
        ) : null}
        <TextInput autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder={isArabic ? "البريد الإلكتروني" : "Email"} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
        <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder={isArabic ? "كلمة المرور" : "Password"} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
        <Pressable onPress={handleSubmit} disabled={busy} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{mode === "register" ? (isArabic ? "إنشاء الحساب" : "Create account") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Text>}
        </Pressable>
        <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={[styles.switchText, { color: colors.primary }]}>
            {mode === "login" ? (isArabic ? "ليس لديك حساب؟ أنشئي حساباً" : "Need an account? Register") : (isArabic ? "لديك حساب؟ سجّلي الدخول" : "Already registered? Sign in")}
          </Text>
        </Pressable>
        <View style={styles.demoRow}>
          <Pressable onPress={() => handleDemo("nora@justbeauty.local")} style={[styles.demoButton, { borderColor: colors.border }]}>
            <Text style={[styles.demoText, { color: colors.foreground }]}>{isArabic ? "تجربة العميلة" : "Demo customer"}</Text>
          </Pressable>
          <Pressable onPress={() => handleDemo("nadine@justbeauty.local")} style={[styles.demoButton, { borderColor: colors.border }]}>
            <Text style={[styles.demoText, { color: colors.foreground }]}>{isArabic ? "تجربة المديرة" : "Demo manager"}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>{isArabic ? "العودة" : "Go back"}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  mark: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  markText: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { maxWidth: 360, fontSize: 28, lineHeight: 36, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  input: { width: "100%", maxWidth: 360, minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  primaryButton: { width: "100%", maxWidth: 360, minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginTop: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  switchText: { fontSize: 13, fontWeight: "800" },
  demoRow: { flexDirection: "row", gap: 8, width: "100%", maxWidth: 360 },
  demoButton: { flex: 1, borderWidth: 1, borderRadius: 12, minHeight: 44, alignItems: "center", justifyContent: "center" },
  demoText: { fontSize: 12, fontWeight: "800" },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 12 },
  secondaryButtonText: { fontSize: 14, fontWeight: "800" },
});
