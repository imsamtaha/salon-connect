import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function MessagesScreen() {
  const colors = useColors();
  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MESSAGES</Text><Text style={[styles.title, { color: colors.foreground }]}>المحادثات</Text>
    <Pressable onPress={() => Alert.alert("محادثة دار المقص", "سيتم ربط الرسائل بموعدك عند تفعيل حساب الصالون.")} style={[styles.thread, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>د</Text></View><View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>دار المقص</Text><Text style={[styles.preview, { color: colors.muted }]}>يمكنك إرسال ملاحظة أو طلب تذكير...</Text></View><Text style={[styles.time, { color: colors.muted }]}>الآن</Text>
    </Pressable>
    <View style={[styles.note, { backgroundColor: "#FFF8E8", borderColor: "#F2D79B" }]}><Text style={styles.noteText}>المحادثة الداخلية تعمل حتى عند عدم ربط واتساب أو تيليغرام.</Text></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { gap: 15, paddingBottom: 30 }, eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textAlign: "right" }, title: { fontSize: 29, fontWeight: "800", textAlign: "right", marginBottom: 5 }, thread: { flexDirection: "row-reverse", alignItems: "center", gap: 11, padding: 14, borderWidth: 1, borderRadius: 18 }, avatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFF", fontSize: 20, fontWeight: "800" }, copy: { flex: 1, alignItems: "flex-end", gap: 4 }, name: { fontSize: 15, fontWeight: "800" }, preview: { fontSize: 12 }, time: { fontSize: 11 }, note: { padding: 14, borderRadius: 16, borderWidth: 1 }, noteText: { color: "#765A1D", textAlign: "right", fontSize: 12, lineHeight: 19 } });
