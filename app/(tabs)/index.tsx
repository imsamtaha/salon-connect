import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const steps = [
  ["01", "العميلة تختار الخدمة", "تختار العناية المناسبة، الموظفة المفضلة، والوقت الملائم."],
  ["02", "المركز يوافق", "يبقى الطلب قيد الانتظار حتى تؤكده مديرة مركز التجميل."],
  ["03", "Telegram يذكّر", "تصل الموافقة والملاحظات والتذكيرات للعميلة والموظفة."],
];

export default function HomeScreen() {
  const colors = useColors();
  const [connected, setConnected] = useState(false);
  const [sent, setSent] = useState(false);

  function connectTelegram() {
    setConnected(true);
    Alert.alert("Telegram جاهز", "اربط Bot الرسمي من الإعدادات لتفعيل الإرسال المباشر.");
  }

  function sendTest() {
    setSent(true);
    Alert.alert("تم تجهيز التجربة", "سيتم تفعيل الإرسال المباشر بعد إعداد Bot Telegram.");
  }

  return (
    <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.nav}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Text style={styles.brandIcon}>✦</Text></View>
            <Text style={[styles.brandText, { color: colors.foreground }]}>Beauty<Text style={{ color: colors.primary }}>Connect</Text></Text>
          </View>
          <View style={styles.navLinks}><Text style={[styles.navLink, { color: colors.muted }]}>كيف تعمل</Text><Text style={[styles.navLink, { color: colors.muted }]}>Telegram</Text><Text style={[styles.navLink, { color: colors.muted }]}>الأسعار</Text></View>
          <Pressable onPress={() => Alert.alert("تسجيل الدخول", "تسجيل الدخول سيُضاف في المرحلة التالية.")} style={[styles.signIn, { borderColor: colors.border }]}><Text style={[styles.signInText, { color: colors.foreground }]}>دخول</Text></Pressable>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroCopy}>
            <View style={styles.pill}><Text style={styles.pillText}>منصة مراكز التجميل</Text></View>
            <Text style={styles.heroTitle}>مواعيد أجمل، <Text style={styles.heroAccent}>بتنظيم أهدأ.</Text></Text>
            <Text style={styles.heroBody}>Beauty Connect يحوّل طلبات الحجز إلى مواعيد مؤكدة، مع موافقة المركز وإشعارات Telegram في كل خطوة.</Text>
            <View style={styles.heroActions}><Pressable onPress={connectTelegram} style={styles.heroButton}><Text style={styles.heroButtonText}>{connected ? "تم ربط Telegram" : "اربط Telegram"}</Text><Text style={styles.arrow}>←</Text></Pressable><Text style={styles.heroNote}>تجربة مجانية 7 أيام · 49$ شهرياً</Text></View>
          </View>
          <View style={styles.heroVisual}><View style={styles.beautyOrb}><Text style={styles.beautyIcon}>✦</Text></View><View style={styles.floatCard}><View style={[styles.floatDot, { backgroundColor: "#2DD4BF" }]} /><Text style={styles.floatText}>تمت الموافقة</Text></View><View style={[styles.floatCard, styles.floatCardTwo]}><View style={[styles.floatDot, { backgroundColor: "#D6A756" }]} /><Text style={styles.floatText}>تذكير غداً 10:00</Text></View></View>
        </View>

        <View style={styles.trustRow}><Text style={[styles.trustText, { color: colors.muted }]}>لخدمات العناية والجمال الاحترافية</Text><View style={[styles.trustLine, { backgroundColor: colors.border }]} /><Text style={[styles.trustText, { color: colors.muted }]}>TELEGRAM-FIRST</Text></View>
        <View style={styles.sectionIntro}><Text style={[styles.kicker, { color: colors.primary }]}>رحلة واحدة واضحة</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>من الطلب إلى التذكير،<Text style={{ color: colors.primary }}> بلا تخمين.</Text></Text><Text style={[styles.sectionBody, { color: colors.muted }]}>كل موعد له حالة واضحة. الإدارة تحتفظ بالتحكم، والعميلة تعرف دائماً ما سيحدث تالياً.</Text></View>
        <View style={styles.steps}>{steps.map(([number, title, body]) => <View key={number} style={[styles.step, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.stepNumber, { color: colors.primary }]}>{number}</Text><Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.stepBody, { color: colors.muted }]}>{body}</Text></View>)}</View>

        <View style={[styles.integration, { backgroundColor: "#E8F8F5", borderColor: "#B8E6DC" }]}><View style={styles.integrationCopy}><Text style={[styles.kicker, { color: colors.primary }]}>إشعارات فورية</Text><Text style={[styles.integrationTitle, { color: colors.foreground }]}>Telegram يعمل معك.</Text><Text style={[styles.integrationBody, { color: colors.muted }]}>أرسلي الموافقات والملاحظات والتذكيرات للعميلات والموظفات من دون مغادرة سير العمل.</Text><View style={styles.checks}><Text style={[styles.check, { color: colors.foreground }]}>✓ حالات الحجز والموافقة</Text><Text style={[styles.check, { color: colors.foreground }]}>✓ ملاحظات الخدمة والموظفة</Text><Text style={[styles.check, { color: colors.foreground }]}>✓ تذكير قبل 24 ساعة</Text></View><Pressable onPress={sendTest} style={[styles.testButton, { backgroundColor: colors.primary }]}><Text style={styles.testButtonText}>{sent ? "تم تجهيز إشعار تجريبي" : "إرسال إشعار تجريبي"}</Text></Pressable></View><View style={[styles.chatCard, { backgroundColor: colors.surface }]}><View style={styles.chatHeader}><View style={[styles.tgSmall, { backgroundColor: colors.primary }]}><Text style={styles.telegramIconSmall}>➤</Text></View><View><Text style={[styles.chatName, { color: colors.foreground }]}>Beauty Connect Bot</Text><Text style={[styles.chatStatus, { color: colors.success }]}>● متصل</Text></View></View><View style={styles.messageBubble}><Text style={[styles.messageTitle, { color: colors.foreground }]}>تمت الموافقة على الموعد</Text><Text style={[styles.messageBody, { color: colors.muted }]}>الخميس · 10:00 صباحاً{"\n"}Glow Studio · ليان</Text></View><View style={[styles.messageBubble, styles.messageBubbleAlt]}><Text style={[styles.messageTitle, { color: colors.foreground }]}>تذكير</Text><Text style={[styles.messageBody, { color: colors.muted }]}>موعدك غداً. نتطلع لاستقبالك.</Text></View></View></View>
        <View style={styles.footer}><Text style={[styles.footerBrand, { color: colors.foreground }]}>Beauty<Text style={{ color: colors.primary }}>Connect</Text></Text><Text style={[styles.footerText, { color: colors.muted }]}>طريقة أهدأ لإدارة مركز التجميل.</Text><Text style={[styles.footerText, { color: colors.muted }]}>WhatsApp سيُضاف في التحديث القادم.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: 40, gap: 22 }, nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 5 }, brand: { flexDirection: "row", alignItems: "center", gap: 8 }, brandMark: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, brandIcon: { color: "#FFF", fontSize: 18 }, brandText: { fontSize: 18, fontWeight: "900" }, navLinks: { flexDirection: "row", gap: 18 }, navLink: { fontSize: 12, fontWeight: "700" }, signIn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 8 }, signInText: { fontSize: 12, fontWeight: "800" }, hero: { borderRadius: 28, padding: 25, minHeight: 370, flexDirection: "row", overflow: "hidden" }, heroCopy: { flex: 1, maxWidth: 610 }, pill: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,.14)", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 }, pillText: { color: "#BDEAE2", fontSize: 10, letterSpacing: 1.2, fontWeight: "800" }, heroTitle: { color: "#FFF", fontSize: 43, lineHeight: 47, fontWeight: "900", marginTop: 18 }, heroAccent: { color: "#D6A756" }, heroBody: { color: "#DDF8F3", fontSize: 15, lineHeight: 23, marginTop: 15, maxWidth: 520 }, heroActions: { marginTop: 23, gap: 10 }, heroButton: { alignSelf: "flex-start", backgroundColor: "#D6A756", borderRadius: 14, paddingHorizontal: 17, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12 }, heroButtonText: { color: "#233533", fontWeight: "900", fontSize: 13 }, arrow: { color: "#233533", fontSize: 18 }, heroNote: { color: "#A8E1D7", fontSize: 11 }, heroVisual: { width: 280, alignItems: "center", justifyContent: "center" }, beautyOrb: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#D6A756", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-12deg" }] }, beautyIcon: { color: "#0F766E", fontSize: 60 }, floatCard: { position: "absolute", top: 60, right: -5, backgroundColor: "rgba(255,255,255,.92)", borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 7 }, floatCardTwo: { top: 235, right: 35 }, floatDot: { width: 8, height: 8, borderRadius: 4 }, floatText: { color: "#1F2933", fontSize: 11, fontWeight: "800" }, trustRow: { flexDirection: "row", alignItems: "center", gap: 12 }, trustText: { fontSize: 9, letterSpacing: 1, fontWeight: "800" }, trustLine: { flex: 1, height: 1 }, sectionIntro: { alignItems: "center", marginTop: 12 }, kicker: { fontSize: 10, letterSpacing: 1.3, fontWeight: "900" }, sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: "900", textAlign: "center", marginTop: 8 }, sectionBody: { fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 600, marginTop: 8 }, steps: { flexDirection: "row", gap: 12 }, step: { flex: 1, minHeight: 150, borderWidth: 1, borderRadius: 18, padding: 16 }, stepNumber: { fontSize: 12, fontWeight: "900" }, stepTitle: { fontSize: 16, fontWeight: "900", marginTop: 18 }, stepBody: { fontSize: 12, lineHeight: 18, marginTop: 6 }, integration: { flexDirection: "row", gap: 20, borderRadius: 24, borderWidth: 1, padding: 22 }, integrationCopy: { flex: 1 }, integrationTitle: { fontSize: 27, fontWeight: "900", marginTop: 7 }, integrationBody: { fontSize: 14, lineHeight: 21, marginTop: 7 }, checks: { gap: 6, marginTop: 15 }, check: { fontSize: 12, fontWeight: "700" }, testButton: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 17 }, testButtonText: { color: "#FFF", fontSize: 12, fontWeight: "900" }, chatCard: { width: 295, borderRadius: 18, padding: 15, shadowColor: "#0F766E", shadowOpacity: 0.1, shadowRadius: 15 }, chatHeader: { flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, borderBottomColor: "#E7E1D8", paddingBottom: 12 }, tgSmall: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" }, telegramIconSmall: { color: "#FFF", fontSize: 18 }, chatName: { fontSize: 13, fontWeight: "900" }, chatStatus: { fontSize: 10, marginTop: 2 }, messageBubble: { alignSelf: "flex-start", backgroundColor: "#E8F8F5", borderRadius: 13, borderTopLeftRadius: 3, padding: 10, marginTop: 14, maxWidth: 210 }, messageBubbleAlt: { alignSelf: "flex-end", backgroundColor: "#FFF8E8", borderTopLeftRadius: 13, borderTopRightRadius: 3, marginTop: 8 }, messageTitle: { fontSize: 11, fontWeight: "900" }, messageBody: { fontSize: 10, lineHeight: 15, marginTop: 4 }, footer: { borderTopWidth: 1, borderTopColor: "#E7E1D8", paddingTop: 20, alignItems: "center", gap: 5 }, footerBrand: { fontSize: 18, fontWeight: "900" }, footerText: { fontSize: 11 } });
