import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ShimmerBlock } from "@/components/shimmer-block";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useThemeContext } from "@/lib/theme-provider";

type BookingStatus = "draft" | "pending" | "approved";

const services = [
  { id: "facial", name: "تنظيف بشرة عميق", duration: "60 دقيقة", price: "$35" },
  { id: "nails", name: "مانيكير وبديكير", duration: "75 دقيقة", price: "$45" },
  { id: "hair", name: "تسريحة ومكياج", duration: "90 دقيقة", price: "$60" },
];
const staff = ["ليان", "سارة", "نور"];
const dates = [
  { id: "2026-08-20", label: "اليوم · 20 أغسطس" },
  { id: "2026-08-21", label: "غداً · 21 أغسطس" },
  { id: "2026-08-22", label: "السبت · 22 أغسطس" },
];
const times = [
  { id: "07:00:00.000Z", label: "10:00 ص" },
  { id: "09:30:00.000Z", label: "12:30 م" },
  { id: "13:00:00.000Z", label: "4:00 م" },
  { id: "15:30:00.000Z", label: "6:30 م" },
];

export default function BookingsScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const { colorScheme } = useThemeContext();
  const selectedSurface = colorScheme === "dark" ? "#3A220D" : "#FFF1E5";
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [selectedStaff, setSelectedStaff] = useState(staff[0]);
  const [selectedDate, setSelectedDate] = useState(dates[1].id);
  const [selectedTime, setSelectedTime] = useState(times[0].id);
  const [customerNote, setCustomerNote] = useState("");
  const [status, setStatus] = useState<BookingStatus>("draft");
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const bookingsQuery = trpc.bookings.activity.useQuery(undefined, { retry: false });
  const createBooking = trpc.bookings.create.useMutation();
  const selectedDateLabel = dates.find((item) => item.id === selectedDate)?.label ?? dates[1].label;
  const selectedTimeLabel = times.find((item) => item.id === selectedTime)?.label ?? times[0].label;
  const service = services.find((item) => item.id === selectedService) ?? services[0];
  const liveAppointment = bookingsQuery.data?.appointment ?? null;
  const effectiveStatus = status !== "draft" ? status : liveAppointment?.status === "approved" ? "approved" : liveAppointment ? "pending" : "draft";
  const isPending = effectiveStatus === "pending";
  const isApproved = effectiveStatus === "approved";
  const hasBookingRequest = effectiveStatus !== "draft";
  const isActivityLoading = bookingsQuery.isLoading;
  const hasLiveRequestError = bookingsQuery.isError || bookingsQuery.data?.databaseAvailable === false;
  const skeletonBase = colorScheme === "dark" ? "#303235" : "#E8E7E3";
  const skeletonHighlight = colorScheme === "dark" ? "#45484C" : "#F5F3EF";
  const errorCopy = language === "ar"
    ? { title: "تعذر تحميل الحجوزات", body: "تحققي من الاتصال ثم أعيدي المحاولة لعرض حالة طلبك.", retry: "إعادة المحاولة", retrying: "جارٍ إعادة المحاولة…" }
    : { title: "Bookings could not be loaded", body: "Check your connection, then try again to see your request status.", retry: "Try again", retrying: "Retrying…" };
  const activityMeta = status !== "draft"
    ? `${service.name} · ${selectedDateLabel} · ${selectedTimeLabel}`
    : liveAppointment?.appointmentAtISO
      ? new Date(liveAppointment.appointmentAtISO).toLocaleString(language === "ar" ? "ar-LB" : "en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
      : service.name;

  async function submitBooking() {
    setChannelModalVisible(true);
  }

  async function confirmChannel(nextChannel: "telegram" | "whatsapp") {
    try {
      await createBooking.mutateAsync({
        customerName: "نورة أحمد",
        salonName: "JUST beauty",
        serviceName: service.name,
        staffName: selectedStaff,
        appointmentAtISO: `${selectedDate}T${selectedTime}`,
        appointmentLabel: `${selectedDateLabel} · ${selectedTimeLabel}`,
        customerNote: customerNote.trim() || undefined,
        contactChannel: nextChannel,
      });
      setChannelModalVisible(false);
      setStatus("pending");
      await bookingsQuery.refetch();
      Alert.alert("تم إرسال الطلب", nextChannel === "telegram" ? "حُفظ الطلب في قاعدة البيانات وسيبقى قيد الانتظار." : "حُفظ الطلب. WhatsApp اختياري وقد يحتاج إلى إعداد من المركز.");
    } catch {
      Alert.alert("تعذر الحفظ", "تعذر حفظ الحجز في الخادم. تحققي من الاتصال وحاولي مرة أخرى.");
    }
  }



  return <ScreenContainer className="px-5 pt-4" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>BOOK A BEAUTY SERVICE</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>احجزي موعدك</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>اختاري الخدمة والموظفة والوقت المناسب، ثم أرسلي الطلب للموافقة.</Text>

    <View style={[styles.activityPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.activityHeader}><Text style={[styles.activityTitle, { color: colors.foreground }]}>حالة حجوزاتك</Text><Text style={[styles.activityLabel, { color: colors.primary }]}>LIVE STATUS</Text></View>
      {isActivityLoading ? <BookingActivitySkeleton base={skeletonBase} highlight={skeletonHighlight} /> : hasLiveRequestError ? <BookingRequestError title={errorCopy.title} body={errorCopy.body} retryLabel={errorCopy.retry} retryingLabel={errorCopy.retrying} isRetrying={bookingsQuery.isRefetching} onRetry={() => bookingsQuery.refetch()} colors={colors} colorScheme={colorScheme} /> : hasBookingRequest ? <View style={styles.activityBody}><View style={[styles.activityDot, { backgroundColor: isApproved ? colors.success : colors.warning }]} /><View style={styles.activityCopy}><Text style={[styles.activityStatus, { color: colors.foreground }]}>{isApproved ? "تم اعتماد طلبك" : "طلبك بانتظار الموافقة"}</Text><Text style={[styles.activityMeta, { color: colors.muted }]}>{activityMeta}</Text></View></View> : <View style={styles.emptyBooking}><View style={[styles.emptyIcon, { backgroundColor: selectedSurface }]}><Text style={[styles.emptyIconText, { color: colors.primary }]}>✦</Text></View><View style={styles.emptyBookingCopy}><Text style={[styles.emptyBookingTitle, { color: colors.foreground }]}>لا توجد حجوزات مرسلة بعد</Text><Text style={[styles.emptyBookingText, { color: colors.muted }]}>اختاري الخدمة والموعد أدناه لإرسال أول طلب إلى المركز.</Text></View></View>}
    </View>

    <Section title="1 · اختاري الخدمة" colors={colors}><View style={styles.optionGrid}>{services.map((item) => <Pressable key={item.id} onPress={() => setSelectedService(item.id)} style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: selectedService === item.id ? colors.primary : colors.border }]}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.optionMeta, { color: colors.muted }]}>{item.duration} · {item.price}</Text>{selectedService === item.id && <Text style={[styles.selectedMark, { color: colors.primary }]}>✓ مختارة</Text>}</Pressable>)}</View></Section>
    <Section title="2 · اختاري الموظفة" colors={colors}><View style={styles.chips}>{staff.map((item) => <Pressable key={item} onPress={() => setSelectedStaff(item)} style={[styles.chip, { borderColor: selectedStaff === item ? colors.primary : colors.border, backgroundColor: selectedStaff === item ? selectedSurface : colors.surface }]}><Text style={{ color: selectedStaff === item ? colors.primary : colors.foreground, fontWeight: "800" }}>{item}</Text></Pressable>)}</View></Section>
    <Section title="3 · اختاري التاريخ" colors={colors}><View style={styles.chips}>{dates.map((item) => <Pressable key={item.id} onPress={() => setSelectedDate(item.id)} style={[styles.chip, { borderColor: selectedDate === item.id ? colors.primary : colors.border, backgroundColor: selectedDate === item.id ? selectedSurface : colors.surface }]}><Text style={{ color: selectedDate === item.id ? colors.primary : colors.foreground, fontWeight: "800" }}>{item.label}</Text></Pressable>)}</View></Section>
    <Section title="4 · اختاري الوقت" colors={colors}><View style={styles.chips}>{times.map((item) => <Pressable key={item.id} onPress={() => setSelectedTime(item.id)} style={[styles.chip, { borderColor: selectedTime === item.id ? colors.primary : colors.border, backgroundColor: selectedTime === item.id ? selectedSurface : colors.surface }]}><Text style={{ color: selectedTime === item.id ? colors.primary : colors.foreground, fontWeight: "800" }}>{item.label}</Text></Pressable>)}</View></Section>
    <Section title="5 · أضيفي ملاحظة للمركز" colors={colors}><TextInput value={customerNote} onChangeText={setCustomerNote} placeholder="مثال: أفضّل غرفة هادئة أو لدي مناسبة خاصة" placeholderTextColor={colors.muted} multiline maxLength={300} textAlign="right" style={[styles.noteInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} /></Section>

    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.summaryKicker, { color: colors.primary }]}>ملخص الطلب</Text><Text style={[styles.summaryTitle, { color: colors.foreground }]}>{service.name}</Text><Text style={[styles.summaryMeta, { color: colors.muted }]}>{selectedStaff} · {selectedDate} · {selectedTime}</Text>{customerNote.trim() ? <Text style={[styles.customerNotePreview, { color: colors.muted }]}>ملاحظتك: {customerNote.trim()}</Text> : null}<Text style={[styles.pendingNote, { color: isApproved ? colors.success : colors.warning }]}>{isApproved ? "✓ تمت موافقة المركز وإشعارك عبر Telegram" : isPending ? "طلبك بانتظار موافقة إدارة المركز" : "لن يثبت الموعد إلا بعد موافقة إدارة المركز"}</Text>{status === "draft" && <Pressable onPress={submitBooking} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>إرسال طلب الحجز</Text></Pressable>}{isPending && <View style={styles.pendingActions}><View style={[styles.pendingBadge, { borderColor: colors.warning }]}><Text style={{ color: colors.warning, fontWeight: "900" }}>قيد الانتظار</Text></View></View>}{isApproved && <Pressable onPress={() => setStatus("draft")} style={[styles.outlineButton, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>إنشاء طلب آخر</Text></Pressable>}</View>
    <Modal visible={channelModalVisible} transparent animationType="fade" onRequestClose={() => setChannelModalVisible(false)}><View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: colors.background }]}><Text style={[styles.modalTitle, { color: colors.foreground }]}>اختاري طريقة التواصل</Text><Text style={[styles.modalBody, { color: colors.muted }]}>سنستخدم القناة المختارة لإشعارك بالموافقة والتذكير قبل الموعد.</Text><Pressable onPress={() => confirmChannel("telegram")} style={[styles.channelButton, { backgroundColor: colors.primary }]}><Text style={styles.channelButtonText}>Telegram · متاح الآن</Text></Pressable><Pressable onPress={() => confirmChannel("whatsapp")} style={[styles.channelButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.channelButtonText, { color: colors.foreground }]}>WhatsApp · خيار إضافي</Text></Pressable><Pressable onPress={() => setChannelModalVisible(false)} style={styles.cancelButton}><Text style={[styles.cancelText, { color: colors.muted }]}>إلغاء</Text></Pressable></View></View></Modal>
  </ScrollView></ScreenContainer>;
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{children}</View>;
}

function BookingRequestError({ title, body, retryLabel, retryingLabel, isRetrying, onRetry, colors, colorScheme }: { title: string; body: string; retryLabel: string; retryingLabel: string; isRetrying: boolean; onRetry: () => void; colors: ReturnType<typeof useColors>; colorScheme: "light" | "dark" }) {
  const isLight = colorScheme === "light";
  return <View accessibilityRole="alert" style={[styles.requestError, { borderColor: isLight ? "#E7C3B8" : "#5A2A25", backgroundColor: isLight ? "#FFF9F6" : "#211513" }]}><View style={[styles.emptyIcon, { backgroundColor: isLight ? "#FDE9E2" : "#3B1D19" }]}><Text style={[styles.emptyIconText, { color: isLight ? "#B33A25" : "#FF9D87" }]}>!</Text></View><View style={styles.emptyBookingCopy}><Text style={[styles.emptyBookingTitle, { color: isLight ? "#4A1E17" : "#FFD8CF" }]}>{title}</Text><Text style={[styles.emptyBookingText, { color: isLight ? "#805C55" : "#CBA9A2" }]}>{body}</Text></View><Pressable accessibilityRole="button" accessibilityState={{ busy: isRetrying, disabled: isRetrying }} disabled={isRetrying} onPress={onRetry} style={[styles.retryAction, { backgroundColor: colors.primary }, isRetrying && styles.retryActionDisabled]}><Text style={styles.retryActionText}>{isRetrying ? retryingLabel : retryLabel}</Text></Pressable></View>;
}

function BookingActivitySkeleton({ base, highlight }: { base: string; highlight: string }) {
  return <View style={styles.skeletonActivity} accessibilityLabel="Loading booking status" accessibilityState={{ busy: true }}><ShimmerBlock style={styles.skeletonDot} baseColor={base} highlightColor={highlight} /><View style={styles.skeletonCopy}><ShimmerBlock style={[styles.skeletonLine, styles.skeletonLinePrimary]} baseColor={base} highlightColor={highlight} /><ShimmerBlock style={[styles.skeletonLine, styles.skeletonLineSecondary]} baseColor={base} highlightColor={highlight} /></View></View>;
}

const styles = StyleSheet.create({
  content: { gap: 15, paddingBottom: 36 },
  noteInput: { minHeight: 90, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 13, lineHeight: 20 },
  customerNotePreview: { fontSize: 12, lineHeight: 18, textAlign: "right" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, gap: 11 },
  modalTitle: { fontSize: 20, fontWeight: "900", textAlign: "right" }, modalBody: { fontSize: 13, lineHeight: 20, textAlign: "right", marginBottom: 4 },
  channelButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" }, channelButtonText: { color: "#FFF", fontWeight: "900", fontSize: 13 },
  cancelButton: { alignItems: "center", paddingVertical: 10 }, cancelText: { fontWeight: "800" }, eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: "900", textAlign: "right" },
  title: { fontSize: 31, fontWeight: "900", textAlign: "right" }, subtitle: { fontSize: 13, lineHeight: 20, textAlign: "right" }, section: { gap: 9 }, sectionTitle: { fontSize: 17, fontWeight: "900", textAlign: "right" },
  optionGrid: { gap: 9 }, serviceCard: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "flex-end", gap: 5 }, optionTitle: { fontSize: 15, fontWeight: "900" }, optionMeta: { fontSize: 12 }, selectedMark: { fontSize: 11, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }, chip: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 17, alignItems: "flex-end", gap: 8, marginTop: 4 }, summaryKicker: { fontSize: 10, letterSpacing: 1, fontWeight: "900" }, summaryTitle: { fontSize: 19, fontWeight: "900" }, summaryMeta: { fontSize: 13 }, pendingNote: { fontSize: 12, fontWeight: "800", textAlign: "right" },
  primaryButton: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 12, marginTop: 5 }, primaryText: { color: "#FFF", fontWeight: "900", fontSize: 12 }, pendingActions: { width: "100%", alignItems: "flex-end", gap: 8 }, pendingBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }, outlineButton: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 11, marginTop: 3 },
  activityPanel: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 }, activityHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, activityTitle: { fontSize: 15, fontWeight: "900" }, activityLabel: { fontSize: 9, letterSpacing: 1.1, fontWeight: "900" },
  skeletonActivity: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 4 }, skeletonDot: { width: 34, height: 34, borderRadius: 12 }, skeletonCopy: { flex: 1, alignItems: "flex-end", gap: 7 }, skeletonLine: { height: 10, borderRadius: 99 }, skeletonLinePrimary: { width: "58%" }, skeletonLineSecondary: { width: "82%" },
  activityBody: { flexDirection: "row-reverse", alignItems: "center", gap: 10 }, activityDot: { width: 9, height: 9, borderRadius: 99 }, activityCopy: { flex: 1, alignItems: "flex-end", gap: 3 }, activityStatus: { fontSize: 13, fontWeight: "900" }, activityMeta: { fontSize: 11, textAlign: "right" },
  emptyBooking: { flexDirection: "row-reverse", alignItems: "center", gap: 10 }, emptyIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, emptyIconText: { fontSize: 17, fontWeight: "900" }, emptyBookingCopy: { flex: 1, alignItems: "flex-end", gap: 3 }, emptyBookingTitle: { fontSize: 13, fontWeight: "900" }, emptyBookingText: { fontSize: 11, lineHeight: 17, textAlign: "right" },
  requestError: { alignItems: "flex-end", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 }, retryAction: { minWidth: 110, alignItems: "center", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, retryActionDisabled: { opacity: 0.62 }, retryActionText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
});
