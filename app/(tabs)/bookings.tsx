import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type BookingStatus = "pending" | "approved";

export default function BookingsScreen() {
  const colors = useColors();
  const [status, setStatus] = useState<BookingStatus>("pending");
  const approveBooking = trpc.bookings.approve.useMutation();
  const isApproved = status === "approved";

  async function approveAndNotify() {
    try {
      const result = await approveBooking.mutateAsync({
        bookingId: "SC-0148",
        customerName: "نورة أحمد",
        salonName: "دار المقص",
        serviceName: "قص وتصفيف",
        appointmentAt: "الخميس 14 أغسطس · 6:30 م",
        appointmentAtISO: "2026-08-14T15:30:00.000Z",
        staffName: "سارة",
      });
      setStatus("approved");
      if (result.notification.delivered) {
        Alert.alert("تمت الموافقة", "تم إرسال إشعار Telegram للعميلة فوراً وجدولة تذكير قبل 24 ساعة من الموعد.");
      } else if (result.notification.duplicate) {
        Alert.alert("تمت الموافقة مسبقاً", "تم منع إرسال إشعار Telegram مكرر.");
      } else {
        Alert.alert("تمت الموافقة", "تغيرت الحالة، وستُرسل رسالة تذكير قبل 24 ساعة بعد إكمال إعداد Telegram لهذا العميل.");
      }
    } catch {
      Alert.alert("تعذر الإرسال", "تمت محاولة الموافقة، لكن تعذر الوصول إلى خدمة Telegram. حاول مرة أخرى.");
    }
  }

  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MY BOOKINGS</Text><Text style={[styles.title, { color: colors.foreground }]}>مواعيدي</Text>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isApproved ? "#A8DCCB" : colors.border }]}>
      <View style={[styles.badge, { backgroundColor: isApproved ? "#DDF5EC" : "#FEF3C7" }]}><View style={[styles.dot, { backgroundColor: isApproved ? colors.success : colors.warning }]} /><Text style={{ color: isApproved ? "#17734F" : "#9A6B12", fontWeight: "800", fontSize: 12 }}>{isApproved ? "تمت الموافقة" : "بانتظار الموافقة"}</Text></View>
      <Text style={[styles.name, { color: colors.foreground }]}>دار المقص · قص وتصفيف</Text><Text style={[styles.meta, { color: colors.muted }]}>الخميس 14 أغسطس · 6:30 م · الموظف: سارة</Text>
      <Text style={[styles.helper, { color: isApproved ? colors.success : colors.warning }]}>{isApproved ? "تم إرسال إشعار Telegram للعميلة." : "لن يثبت الموعد إلا بعد موافقة صاحبة الصالون."}</Text>
      {!isApproved ? <Pressable disabled={approveBooking.isPending} onPress={approveAndNotify} style={[styles.approve, { backgroundColor: colors.primary, opacity: approveBooking.isPending ? 0.6 : 1 }]}><Text style={styles.approveText}>{approveBooking.isPending ? "جارٍ الإرسال..." : "موافقة وإرسال Telegram"}</Text></Pressable> : <View style={[styles.approvedRow, { borderColor: colors.success }]}><Text style={[styles.approvedText, { color: colors.success }]}>✓ تم إشعار العميل فوراً</Text></View>}
      <Pressable onPress={() => { setStatus("pending"); approveBooking.reset(); }} style={[styles.outline, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>{isApproved ? "إعادة العرض كطلب معلق" : "إلغاء الطلب"}</Text></Pressable>
    </View>
    <View style={[styles.empty, { borderColor: colors.border }]}><Text style={{ fontSize: 28 }}>◷</Text><Text style={[styles.emptyTitle, { color: colors.foreground }]}>تظهر مواعيدك المؤكدة هنا</Text><Text style={[styles.meta, { color: colors.muted }]}>ابدئي بطلب موعد من الصفحة الرئيسية.</Text></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { gap: 14, paddingBottom: 30 }, eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textAlign: "right" }, title: { fontSize: 29, fontWeight: "800", textAlign: "right", marginBottom: 6 }, card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 }, badge: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }, dot: { width: 7, height: 7, borderRadius: 4 }, name: { textAlign: "right", fontSize: 17, fontWeight: "800" }, meta: { textAlign: "right", fontSize: 13, lineHeight: 20 }, helper: { textAlign: "right", fontSize: 12, lineHeight: 18 }, approve: { alignSelf: "flex-end", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 5 }, approveText: { color: "#FFF", fontWeight: "900", fontSize: 12 }, approvedRow: { alignSelf: "flex-end", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 5 }, approvedText: { fontSize: 12, fontWeight: "900" }, outline: { alignSelf: "flex-end", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: 5 }, empty: { borderRadius: 20, borderWidth: 1, borderStyle: "dashed", alignItems: "center", padding: 28, gap: 7 }, emptyTitle: { fontSize: 16, fontWeight: "800" } });
