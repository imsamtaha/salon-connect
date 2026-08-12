import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";
import { startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const [isStarting, setIsStarting] = useState(false);
  const isArabic = language === "ar";

  const handleLogin = async () => {
    setIsStarting(true);
    try {
      await startOAuthLogin();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScreenContainer className="px-6 pt-8" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={styles.markText}>BC</Text>
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          BEAUTY CONNECT
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isArabic ? "سجّلي دخولك لمتابعة مواعيدك" : "Sign in to manage your beauty appointments"}
        </Text>
        <Text style={[styles.body, { color: colors.muted }]}>
          {isArabic
            ? "احفظي معلوماتك، تابعي موافقات المركز، واحتفظي بمحادثاتك في مكان واحد."
            : "Save your details, follow center approvals, and keep your conversations in one place."}
        </Text>

        <Pressable
          onPress={handleLogin}
          disabled={isStarting}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed || isStarting ? 0.78 : 1 },
          ]}
        >
          {isStarting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{isArabic ? "الدخول عبر Manus" : "Continue with Manus"}</Text>}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            {isArabic ? "العودة" : "Go back"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  mark: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  markText: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 1 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { maxWidth: 360, fontSize: 30, lineHeight: 38, fontWeight: "900", textAlign: "center" },
  body: { maxWidth: 340, fontSize: 15, lineHeight: 23, textAlign: "center" },
  primaryButton: { width: "100%", maxWidth: 360, minHeight: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginTop: 12 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 12 },
  secondaryButtonText: { fontSize: 14, fontWeight: "800" },
});
