import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type BookingStatus = "draft" | "pending" | "approved";

const services = [
  { id: "facial", name: "تنظيف بشرة عميق", duration: "60 دقيقة", price: "$35" },
  { id: "nails", name: "مانيكير وبديكير", duration: "75 دقيقة", price: "$45" },
  { id: "hair", name: "تسريحة ومكياج", duration: "90 دقيقة", price: "$60" },
];
const staff = ["ليان", "سارة", "نور"];
const dates = ["اليوم · 14 أغسطس", "غداً · 15 أغسطس", "السبت · 16 أغسطس"];
const times = ["10:00 ص", "12:30 م", "4:00 م", "6:30 م"];

export default function BookingsScreen() {
  const colors = useColors();
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [selectedStaff, setSelectedStaff] = useState(staff[0]);
  const [selectedDate, setSelectedDate] = useState(dates[1]);
  const [selectedTime, setSelectedTime] = useState(times[0]);
  const [status, setStatus] = useState<BookingStatus>("draft");
  const approveBooking = trpc.bookings.approve.useMutation();
  const service = services.find((item) => item.id === selectedService) ?? services[0];
  const isPending = status === "pending";
  const isApproved = status === "approved";

  async function submitBooking() {
    setStatus("pending");
    Alert.alert("تم إرسال الطلب", "سيبقى الموعد قيد الانتظار حتى موافقة إدارة المركز.");
  }

  async function approveAndNotify() {
    try {
      const result = await approveBooking.mutateAsync({
        bookingId: "BC-0148",
        customerName: "نورة أحمد",
        salonName: "Glow Studio",
        serviceName: service.name,
        appointmentAt: `${selectedDate} · ${selectedTime}`,
        appointmentAtISO: "2026-08-15T07:00:00.000Z",
        staffName: selectedStaff,
      });
      setStatus("approved");
      Alert.alert(result.notification.delivered ? "تمت الموافقة" : "تم تحديث الحالة", result.notification.delivered ? "تم إرسال إشعار Telegram وجدولة تذكير قبل 24 ساعة." : "تمت الموافقة، وسيُرسل التذكير بعد إعداد Telegram للعميلة.");
    } catch {
      Alert.alert("تعذر الإرسال", "تعذر الوصول إلى خدمة Telegram. حاول مرة أخرى.");
    }
  }

  return <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>BOOK A BEAUTY SERVICE</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>احجزي موعدك</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>اختاري الخدمة والموظفة والوقت المناسب، ثم أرسلي الطلب للموافقة.</Text>

    <Section title="1 · اختاري الخدمة" colors={colors}><View style={styles.optionGrid}>{services.map((item) => <Pressable key={item.id} onPress={() => setSelectedService(item.id)} style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: selectedService === item.id ? colors.primary : colors.border }]}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.optionMeta, { color: colors.muted }]}>{item.duration} · {item.price}</Text>{selectedService === item.id && <Text style={[styles.selectedMark, { color: colors.primary }]}>✓ مختارة</Text>}</Pressable>)}</View></Section>
    <Section title="2 · اختاري الموظفة" colors={colors}><View style={styles.chips}>{staff.map((item) => <Pressable key={item} onPress={() => setSelectedStaff(item)} style={[styles.chip, { borderColor: selectedStaff === item ? colors.primary : colors.border, backgroundColor: selectedStaff === item ? "#E8F8F5" : colors.surface }]}><Text style={{ color: selectedStaff === item ? colors.primary : colors.foreground, fontWeight: "800" }}>{item}</Text></Pressable>)}</View></Section>
    <Section title="3 · اختاري التاريخ" colors={colors}><View style={styles.chips}>{dates.map((item) => <Pressable key={item} onPress={() => setSelectedDate(item)} style={[styles.chip, { borderColor: selectedDate === item ? colors.primary : colors.border, backgroundColor: selectedDate === item ? "#E8F8F5" : colors.surface }]}><Text style={{ color: selectedDate === item ? colors.primary : colors.foreground, fontWeight: "800" }}>{item}</Text></Pressable>)}</View></Section>
    <Section title="4 · اختاري الوقت" colors={colors}><View style={styles.chips}>{times.map((item) => <Pressable key={item} onPress={() => setSelectedTime(item)} style={[styles.chip, { borderColor: selectedTime === item ? colors.primary : colors.border, backgroundColor: selectedTime === item ? "#E8F8F5" : colors.surface }]}><Text style={{ color: selectedTime === item ? colors.primary : colors.foreground, fontWeight: "800" }}>{item}</Text></Pressable>)}</View></Section>

    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.summaryKicker, { color: colors.primary }]}>ملخص الطلب</Text><Text style={[styles.summaryTitle, { color: colors.foreground }]}>{service.name}</Text><Text style={[styles.summaryMeta, { color: colors.muted }]}>{selectedStaff} · {selectedDate} · {selectedTime}</Text><Text style={[styles.pendingNote, { color: isApproved ? colors.success : colors.warning }]}>{isApproved ? "✓ تمت موافقة المركز وإشعارك عبر Telegram" : isPending ? "طلبك بانتظار موافقة إدارة المركز" : "لن يثبت الموعد إلا بعد موافقة إدارة المركز"}</Text>{status === "draft" && <Pressable onPress={submitBooking} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>إرسال طلب الحجز</Text></Pressable>}{isPending && <View style={styles.pendingActions}><View style={[styles.pendingBadge, { borderColor: colors.warning }]}><Text style={{ color: colors.warning, fontWeight: "900" }}>قيد الانتظار</Text></View><Pressable disabled={approveBooking.isPending} onPress={approveAndNotify} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: approveBooking.isPending ? 0.6 : 1 }]}><Text style={styles.primaryText}>{approveBooking.isPending ? "جارٍ التأكيد..." : "محاكاة موافقة المركز"}</Text></Pressable></View>}{isApproved && <Pressable onPress={() => setStatus("draft")} style={[styles.outlineButton, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>إنشاء طلب آخر</Text></Pressable>}</View>
  </ScrollView></ScreenContainer>;
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({ content: { gap: 15, paddingBottom: 36 }, eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: "900", textAlign: "right" }, title: { fontSize: 31, fontWeight: "900", textAlign: "right" }, subtitle: { fontSize: 13, lineHeight: 20, textAlign: "right" }, section: { gap: 9 }, sectionTitle: { fontSize: 17, fontWeight: "900", textAlign: "right" }, optionGrid: { gap: 9 }, serviceCard: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "flex-end", gap: 5 }, optionTitle: { fontSize: 15, fontWeight: "900" }, optionMeta: { fontSize: 12 }, selectedMark: { fontSize: 11, fontWeight: "900" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }, chip: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 }, summary: { borderWidth: 1, borderRadius: 20, padding: 17, alignItems: "flex-end", gap: 8, marginTop: 4 }, summaryKicker: { fontSize: 10, letterSpacing: 1, fontWeight: "900" }, summaryTitle: { fontSize: 19, fontWeight: "900" }, summaryMeta: { fontSize: 13 }, pendingNote: { fontSize: 12, fontWeight: "800", textAlign: "right" }, primaryButton: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 12, marginTop: 5 }, primaryText: { color: "#FFF", fontWeight: "900", fontSize: 12 }, pendingActions: { width: "100%", alignItems: "flex-end", gap: 8 }, pendingBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }, outlineButton: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 11, marginTop: 3 } });
