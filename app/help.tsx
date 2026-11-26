import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RaisedButton } from "@/components/raised-button";
import { router } from "expo-router";
import { name as APP_NAME } from "@/constants/branding.json";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";

const sections = [
  {
    title: "ابدئي من هنا",
    body: "أنشئي حساب المديرة عبر تسجيل الدخول، ثم أضيفي اسم المركز ووسيلة التواصل وساعات العمل. بعد ذلك أضيفي الخدمات والموظفات حتى تظهر للزبائن عند الحجز.",
  },
  {
    title: "كيف تستقبلين الحجز؟",
    body: "تصل كل طلبات الحجز إلى لوحة المركز بحالة قيد الانتظار. راجعي اسم الزبونة والخدمة والموظفة والتاريخ والوقت والملاحظات، ثم اختاري موافقة أو رفض. لا يصبح الموعد مؤكداً قبل قرارك.",
  },
  {
    title: "ماذا يحدث بعد الموافقة؟",
    body: "تتغير حالة الطلب إلى تمت الموافقة، ويُحدّث سجل الزبونة ببيانات الموعد. يرسل النظام إشعاراً فورياً عبر قناة التواصل التي اختارتها الزبونة، ثم يجهز تذكيراً قبل 24 ساعة.",
  },
  {
    title: "Telegram وWhatsApp",
    body: "يمكن للزبونة اختيار Telegram أو WhatsApp من النافذة الظاهرة قبل إرسال الطلب. Telegram هو القناة المفعّلة حالياً. يظهر WhatsApp كخيار اختياري، ولا يدّعي النظام نجاح الإرسال حتى يتم إعداد WhatsApp Business ومعلومات الاعتماد الخاصة بالمركز.",
  },
  {
    title: "إدارة المحادثات",
    body: "استخدمي تبويب المحادثات لحفظ الأسئلة والملاحظات المرتبطة بالزبونة. اكتبي بوضوح تفاصيل الخدمة أو التعديل المطلوب، ولا ترسلي معلومات حساسة في رسالة غير ضرورية.",
  },
  {
    title: "الاشتراك والتجربة",
    body: "تبدأ المنصة بتجربة مجانية لمدة 7 أيام. بعد انتهاء التجربة تصبح الخطة المدفوعة 49 دولاراً شهرياً للمركز عند تفعيلها. راجعي تفاصيل الخطة قبل إتمام الدفع.",
  },
  {
    title: "قائمة المراجعة اليومية",
    body: "راجعي الطلبات المعلقة، تحققي من جدول اليوم والغد، تابعي حالات الإشعارات، حدّثي أوقات الموظفات، وأغلقي أو عدّلي أي موعد لم يعد متاحاً.",
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const isArabic = language === "ar";

  return (
    <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <RaisedButton onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>{isArabic ? "رجوع" : "Back"}</Text>
        </RaisedButton>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>CENTER GUIDE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{isArabic ? "دليل المديرة" : "Manager guide"}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{isArabic ? `شرح عملي لكل خطوة داخل ${APP_NAME}.` : `A practical guide to every step in ${APP_NAME}.`}</Text>
        {sections.map((section, index) => (
          <View key={section.title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.number, { backgroundColor: colors.primary }]}><Text style={styles.numberText}>{index + 1}</Text></View>
            <View style={styles.copy}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isArabic ? section.title : section.title}</Text><Text style={[styles.body, { color: colors.muted }]}>{isArabic ? section.body : translateSection(index)}</Text></View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function translateSection(index: number) {
  return [
    "Create the manager account, then add the center name, contact channel, opening hours, services, and staff.",
    "Review each pending request and choose approve or reject. The appointment is not confirmed before your decision.",
    "Approval updates the customer record, sends an immediate notification through the selected channel, and prepares a reminder 24 hours before the appointment.",
    "Customers can choose Telegram or WhatsApp. Telegram is active now; WhatsApp remains optional until Business credentials are configured.",
    "Use Messages to keep customer questions and appointment notes organized.",
    "The platform starts with a 7-day free trial, followed by a $49 monthly plan when activated.",
    "Review pending requests, tomorrow's schedule, delivery status, staff availability, and changed appointments each day.",
  ][index];
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 40 },
  backButton: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8 },
  backText: { fontSize: 13, fontWeight: "900" },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: "900", textAlign: "right" },
  title: { fontSize: 31, fontWeight: "900", textAlign: "right" },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: "right" },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 },
  number: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  numberText: { color: "#FFFFFF", fontWeight: "900" },
  copy: { flex: 1, gap: 6, alignItems: "flex-end" },
  sectionTitle: { fontSize: 16, fontWeight: "900", textAlign: "right" },
  body: { fontSize: 13, lineHeight: 21, textAlign: "right" },
});
