import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function ProfileScreen() {
  const colors = useColors();
  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MY PROFILE</Text><Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
    <View style={[styles.profile, { backgroundColor: colors.primary }]}><View style={styles.avatar}><Text style={[styles.initial, { color: colors.primary }]}>ن</Text></View><View style={styles.profileCopy}><Text style={styles.profileName}>نورة أحمد</Text><Text style={styles.profileMeta}>عضوية منذ أغسطس 2026</Text></View></View>
    <Text style={[styles.section, { color: colors.foreground }]}>تفضيلات الحجز</Text>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}><Text style={[styles.value, { color: colors.primary }]}>سارة</Text><Text style={[styles.label, { color: colors.foreground }]}>الموظف المعتاد</Text></View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.row}><Text style={[styles.value, { color: colors.primary }]}>مفعّلة</Text><Text style={[styles.label, { color: colors.foreground }]}>تذكيرات المواعيد</Text></View>
    </View>
    <Text style={[styles.section, { color: colors.foreground }]}>الخطة</Text>
    <View style={[styles.plan, { backgroundColor: "#F3E9D2", borderColor: "#E6C987" }]}><Text style={styles.planTitle}>تجربة مجانية لمدة 7 أيام</Text><Text style={styles.planBody}>بعد التجربة، يمكن لصاحبة الصالون تفعيل جميع المميزات مقابل 49$ شهرياً.</Text><Pressable onPress={() => Alert.alert("الاشتراك", "سيتم تفعيل الدفع بعد ربط مزود الدفع الرسمي.")} style={styles.planButton}><Text style={styles.planButtonText}>عرض تفاصيل الاشتراك</Text></Pressable></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { gap: 15, paddingBottom: 30 }, eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textAlign: "right" }, title: { fontSize: 29, fontWeight: "800", textAlign: "right", marginBottom: 3 }, profile: { borderRadius: 21, padding: 18, flexDirection: "row-reverse", alignItems: "center", gap: 13 }, avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#F3E9D2", alignItems: "center", justifyContent: "center" }, initial: { fontSize: 23, fontWeight: "800" }, profileCopy: { flex: 1, alignItems: "flex-end", gap: 4 }, profileName: { color: "#FFF", fontSize: 17, fontWeight: "800" }, profileMeta: { color: "#DDF8F3", fontSize: 12 }, section: { fontSize: 17, fontWeight: "800", textAlign: "right", marginTop: 4 }, card: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 15 }, row: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 15 }, label: { fontSize: 14, fontWeight: "700" }, value: { fontSize: 13, fontWeight: "800" }, divider: { height: 1 }, plan: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 7 }, planTitle: { textAlign: "right", color: "#6B531E", fontSize: 16, fontWeight: "800" }, planBody: { textAlign: "right", color: "#765A1D", fontSize: 12, lineHeight: 19 }, planButton: { alignSelf: "flex-end", backgroundColor: "#B7791F", borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, marginTop: 4 }, planButtonText: { color: "#FFF", fontSize: 12, fontWeight: "800" } });
