import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function BookingsScreen() {
  const colors = useColors();
  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MY BOOKINGS</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>مواعيدي</Text>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}><Text style={{ color: "#9A6B12", fontWeight: "800", fontSize: 12 }}>بانتظار الموافقة</Text></View>
      <Text style={[styles.name, { color: colors.foreground }]}>دار المقص · قص وتصفيف</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>الخميس 14 أغسطس · 6:30 م · الموظف: سارة</Text>
      <Text style={[styles.helper, { color: colors.warning }]}>لن يثبت الموعد إلا بعد موافقة صاحبة الصالون.</Text>
      <Pressable onPress={() => Alert.alert("تم إلغاء الطلب", "أصبح بإمكانك إنشاء طلب جديد في أي وقت.")} style={[styles.outline, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>إلغاء الطلب</Text></Pressable>
    </View>
    <View style={[styles.empty, { borderColor: colors.border }]}><Text style={{ fontSize: 28 }}>◷</Text><Text style={[styles.emptyTitle, { color: colors.foreground }]}>تظهر مواعيدك المؤكدة هنا</Text><Text style={[styles.meta, { color: colors.muted }]}>ابدئي بطلب موعد من الصفحة الرئيسية.</Text></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { gap: 14, paddingBottom: 30 }, eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textAlign: "right" }, title: { fontSize: 29, fontWeight: "800", textAlign: "right", marginBottom: 6 }, card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 }, badge: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }, name: { textAlign: "right", fontSize: 17, fontWeight: "800" }, meta: { textAlign: "right", fontSize: 13, lineHeight: 20 }, helper: { textAlign: "right", fontSize: 12, lineHeight: 18 }, outline: { alignSelf: "flex-end", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: 5 }, empty: { borderRadius: 20, borderWidth: 1, borderStyle: "dashed", alignItems: "center", padding: 28, gap: 7 }, emptyTitle: { fontSize: 16, fontWeight: "800" } });
