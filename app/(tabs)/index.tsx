import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Notifications from "expo-notifications";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const salons = [
  { name: "دار المقص", area: "الرياض · حي النخيل", rating: "4.9", next: "اليوم 6:30 م", accent: "#0F766E" },
  { name: "صالة ركن", area: "جدة · الروضة", rating: "4.8", next: "غداً 11:00 ص", accent: "#B7791F" },
];

export default function HomeScreen() {
  const colors = useColors();
  const [bookingStatus, setBookingStatus] = useState<"idle" | "pending">("idle");
  const [selectedSalon, setSelectedSalon] = useState(salons[0]);

  const statusText = useMemo(
    () => bookingStatus === "pending" ? "طلبك بانتظار موافقة صاحبة الصالون" : "لا توجد مواعيد مؤكدة اليوم",
    [bookingStatus],
  );

  async function requestBooking() {
    setBookingStatus("pending");
    if (Platform.OS !== "web") {
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") await Notifications.requestPermissionsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "تم إرسال طلب الموعد",
          body: `سيصلك إشعار بعد رد صاحبة ${selectedSalon.name}`,
          data: { type: "booking-request" },
        },
        trigger: null,
      });
    }
    Alert.alert("تم إرسال الطلب", "لن يصبح الموعد مؤكداً إلا بعد موافقة صاحبة الصالون.");
  }

  return (
    <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>SALON CONNECT</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>مساء الخير، نورة</Text>
          </View>
          <Pressable accessibilityLabel="الإشعارات" style={[styles.bell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.bellText}>♢</Text>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          </Pressable>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>احجزي بثقة</Text>
            <Text style={styles.heroTitle}>موعدك القادم يبدأ من هنا</Text>
            <Text style={styles.heroBody}>اختاري صالونك وموظفك المعتاد، وسنتابع الموافقة معك.</Text>
          </View>
          <Text style={styles.heroMark}>✂</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: bookingStatus === "pending" ? "#FEF3C7" : "#DFF5EC" }]}>
            <Text>{bookingStatus === "pending" ? "…" : "✓"}</Text>
          </View>
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>{statusText}</Text>
            <Text style={[styles.statusBody, { color: colors.muted }]}>{bookingStatus === "pending" ? "سنبلغك فور الموافقة أو اقتراح وقت بديل." : "ابدئي بطلب موعد جديد مع صالونك المفضل."}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>صالوناتك المفضلة</Text>
          <Pressable><Text style={[styles.link, { color: colors.primary }]}>عرض الكل</Text></Pressable>
        </View>

        {salons.map((salon) => (
          <Pressable key={salon.name} onPress={() => setSelectedSalon(salon)} style={({ pressed }) => [styles.salonCard, { backgroundColor: colors.surface, borderColor: selectedSalon.name === salon.name ? colors.primary : colors.border }, pressed && styles.pressed]}>
            <View style={[styles.salonAvatar, { backgroundColor: salon.accent }]}><Text style={styles.avatarText}>{salon.name.slice(0, 1)}</Text></View>
            <View style={styles.salonInfo}>
              <View style={styles.rowBetween}><Text style={[styles.salonName, { color: colors.foreground }]}>{salon.name}</Text><Text style={[styles.rating, { color: colors.warning }]}>★ {salon.rating}</Text></View>
              <Text style={[styles.salonMeta, { color: colors.muted }]}>{salon.area}</Text>
              <Text style={[styles.next, { color: colors.primary }]}>أقرب وقت: {salon.next}</Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>إجراءات سريعة</Text></View>
        <View style={styles.actions}>
          <Pressable onPress={requestBooking} style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
            <Text style={styles.actionIcon}>＋</Text><Text style={styles.primaryActionText}>طلب موعد</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("المحادثات", "ستظهر هنا المحادثات المرتبطة بمواعيدك.")} style={({ pressed }) => [styles.secondaryAction, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <Text style={[styles.actionIcon, { color: colors.primary }]}>◌</Text><Text style={[styles.secondaryActionText, { color: colors.foreground }]}>المحادثات</Text>
          </Pressable>
        </View>

        <View style={[styles.notice, { backgroundColor: "#FFF8E8", borderColor: "#F2D79B" }]}>
          <Text style={styles.noticeIcon}>i</Text>
          <Text style={styles.noticeText}>تأكيد الموعد يتم فقط بعد موافقة صاحبة الصالون. يمكنك متابعة الحالة من صفحة «مواعيدي».</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34, gap: 16 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: "800", textAlign: "right" },
  title: { fontSize: 27, fontWeight: "800", marginTop: 5, textAlign: "right" },
  bell: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  bellText: { fontSize: 24, transform: [{ rotate: "45deg" }] },
  dot: { position: "absolute", width: 8, height: 8, borderRadius: 4, top: 9, right: 9 },
  hero: { borderRadius: 24, padding: 20, minHeight: 154, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  heroCopy: { flex: 1, alignItems: "flex-end" },
  heroKicker: { color: "#BDEAE2", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  heroTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 30, fontWeight: "800", textAlign: "right" },
  heroBody: { color: "#DDF8F3", fontSize: 13, lineHeight: 20, textAlign: "right", marginTop: 8 },
  heroMark: { color: "#A8E1D7", fontSize: 72, opacity: 0.65, transform: [{ rotate: "-25deg" }], marginRight: 8 },
  statusCard: { flexDirection: "row-reverse", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  statusIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  statusCopy: { flex: 1, alignItems: "flex-end" },
  statusTitle: { fontSize: 14, fontWeight: "800", textAlign: "right" },
  statusBody: { fontSize: 12, lineHeight: 18, marginTop: 3, textAlign: "right" },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  link: { fontSize: 13, fontWeight: "700" },
  salonCard: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 18, borderWidth: 1, padding: 12, gap: 12 },
  salonAvatar: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  salonInfo: { flex: 1, gap: 3 },
  rowBetween: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  salonName: { fontSize: 16, fontWeight: "800" },
  rating: { fontSize: 12, fontWeight: "800" },
  salonMeta: { fontSize: 12 },
  next: { fontSize: 12, fontWeight: "700", marginTop: 3 },
  actions: { flexDirection: "row-reverse", gap: 10 },
  primaryAction: { flex: 1, borderRadius: 16, minHeight: 56, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryAction: { flex: 1, borderRadius: 16, minHeight: 56, borderWidth: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  actionIcon: { color: "#FFFFFF", fontSize: 22, fontWeight: "500" },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryActionText: { fontSize: 14, fontWeight: "800" },
  notice: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 9, padding: 13, borderRadius: 16, borderWidth: 1, marginTop: 4 },
  noticeIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#D6A756", color: "#FFFFFF", textAlign: "center", fontWeight: "900" },
  noticeText: { flex: 1, color: "#765A1D", fontSize: 12, lineHeight: 19, textAlign: "right" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
