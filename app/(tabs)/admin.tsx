import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type RequestStatus = "pending" | "approved" | "rejected";
type Request = { id: string; customer: string; service: string; staff: string; date: string; time: string; note: string; status: RequestStatus };

const initialRequests: Request[] = [
  { id: "BC-0148", customer: "نورة أحمد", service: "تنظيف بشرة عميق", staff: "ليان", date: "غداً · 15 أغسطس", time: "10:00 ص", note: "أفضّل غرفة هادئة إن أمكن.", status: "pending" },
  { id: "BC-0147", customer: "ريم خليل", service: "تسريحة ومكياج", staff: "نور", date: "السبت · 16 أغسطس", time: "4:00 م", note: "لدي مناسبة مساءً.", status: "pending" },
  { id: "BC-0145", customer: "سلمى عوض", service: "مانيكير وبديكير", staff: "سارة", date: "اليوم · 14 أغسطس", time: "6:30 م", note: "", status: "approved" },
];

export default function AdminScreen() {
  const colors = useColors();
  const [requests, setRequests] = useState(initialRequests);
  const approveBooking = trpc.bookings.approve.useMutation();
  const pending = useMemo(() => requests.filter((item) => item.status === "pending"), [requests]);
  const processed = useMemo(() => requests.filter((item) => item.status !== "pending"), [requests]);

  async function handleApprove(request: Request) {
    try {
      const result = await approveBooking.mutateAsync({ bookingId: request.id, customerName: request.customer, salonName: "Glow Studio", serviceName: request.service, appointmentAt: `${request.date} · ${request.time}`, appointmentAtISO: "2026-08-15T07:00:00.000Z", staffName: request.staff });
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "approved" } : item));
      Alert.alert("تمت الموافقة", result.notification.delivered ? `تم إشعار ${request.customer} عبر Telegram وجدولة التذكير.` : "تم تحديث الحالة، لكن Telegram غير متصل لهذا العميل.");
    } catch {
      Alert.alert("تعذر تنفيذ الموافقة", "لم يتم تحديث الطلب. تحققي من الاتصال وحاولي مرة أخرى.");
    }
  }

  function handleReject(request: Request) {
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "rejected" } : item));
    Alert.alert("تم رفض الطلب", `تم حفظ رفض طلب ${request.customer}. يمكنك التواصل معها لإرسال وقت بديل.`);
  }

  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>CENTER MANAGEMENT</Text>
    <View style={styles.headerRow}><View style={[styles.countBadge, { backgroundColor: "#FEF3C7" }]}><Text style={{ color: colors.warning, fontWeight: "900" }}>{pending.length} معلّقة</Text></View><View><Text style={[styles.title, { color: colors.foreground }]}>لوحة المركز</Text><Text style={[styles.subtitle, { color: colors.muted }]}>راجعي الطلبات وثبّتي المواعيد بسهولة.</Text></View></View>
    <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}><Stat label="طلبات اليوم" value="08" color={colors.primary} /><Stat label="بانتظار القرار" value={String(pending.length).padStart(2, "0")} color={colors.warning} /><Stat label="تمت الموافقة" value={String(requests.filter((item) => item.status === "approved").length).padStart(2, "0")} color={colors.success} /></View>
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>طلبات بانتظار الموافقة</Text>
    {pending.length === 0 ? <View style={[styles.empty, { borderColor: colors.border }]}><Text style={{ fontSize: 28 }}>✓</Text><Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد طلبات معلّقة</Text><Text style={[styles.subtitle, { color: colors.muted }]}>كل الطلبات تمت مراجعتها.</Text></View> : pending.map((request) => <RequestCard key={request.id} request={request} colors={colors} busy={approveBooking.isPending} onApprove={() => handleApprove(request)} onReject={() => handleReject(request)} />)}
    {processed.length > 0 && <><Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 5 }]}>آخر القرارات</Text>{processed.map((request) => <ProcessedRow key={request.id} request={request} colors={colors} />)}</>}
  </ScrollView></ScreenContainer>;
}

function RequestCard({ request, colors, busy, onApprove, onReject }: { request: Request; colors: ReturnType<typeof useColors>; busy: boolean; onApprove: () => void; onReject: () => void }) {
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cardTop}><Text style={[styles.requestId, { color: colors.muted }]}>{request.id}</Text><View style={[styles.pendingPill, { backgroundColor: "#FEF3C7" }]}><View style={[styles.dot, { backgroundColor: colors.warning }]} /><Text style={{ color: colors.warning, fontWeight: "900", fontSize: 11 }}>بانتظار القرار</Text></View></View><Text style={[styles.customer, { color: colors.foreground }]}>{request.customer}</Text><Text style={[styles.service, { color: colors.primary }]}>{request.service}</Text><View style={styles.detailGrid}><Detail label="الموظفة" value={request.staff} colors={colors} /><Detail label="الموعد" value={`${request.date} · ${request.time}`} colors={colors} /></View>{request.note ? <Text style={[styles.note, { color: colors.muted }]}>ملاحظة: {request.note}</Text> : null}<View style={styles.actions}><Pressable disabled={busy} onPress={onApprove} style={[styles.approveButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}><Text style={styles.approveText}>{busy ? "جارٍ الحفظ..." : "موافقة وإشعار"}</Text></Pressable><Pressable disabled={busy} onPress={onReject} style={[styles.rejectButton, { borderColor: "#E8B6B2" }]}><Text style={{ color: colors.error, fontWeight: "900" }}>رفض الطلب</Text></Pressable></View></View>;
}
function Detail({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) { return <View style={styles.detail}><Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text></View>; }
function Stat({ label, value, color }: { label: string; value: string; color: string }) { return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function ProcessedRow({ request, colors }: { request: Request; colors: ReturnType<typeof useColors> }) { const approved = request.status === "approved"; return <View style={[styles.processed, { borderColor: colors.border }]}><View style={[styles.processedIcon, { backgroundColor: approved ? "#DDF5EC" : "#FDE9E7" }]}><Text style={{ color: approved ? colors.success : colors.error, fontWeight: "900" }}>{approved ? "✓" : "×"}</Text></View><View style={styles.processedText}><Text style={[styles.processedName, { color: colors.foreground }]}>{request.customer} · {request.service}</Text><Text style={[styles.detailLabel, { color: colors.muted }]}>{approved ? "تمت الموافقة والإشعار" : "تم رفض الطلب"}</Text></View></View>; }
const styles = StyleSheet.create({ content: { gap: 14, paddingBottom: 36 }, eyebrow: { fontSize: 10, letterSpacing: 1.1, fontWeight: "900", textAlign: "right" }, headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, title: { fontSize: 30, fontWeight: "900", textAlign: "right" }, subtitle: { fontSize: 13, lineHeight: 20, textAlign: "right" }, countBadge: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 13 }, stats: { flexDirection: "row", borderWidth: 1, borderRadius: 18, padding: 14, justifyContent: "space-between" }, stat: { alignItems: "center", flex: 1, gap: 3 }, statValue: { fontSize: 23, fontWeight: "900" }, statLabel: { fontSize: 11, color: "#687076", textAlign: "center" }, sectionTitle: { fontSize: 18, fontWeight: "900", textAlign: "right" }, card: { borderWidth: 1, borderRadius: 19, padding: 15, gap: 9 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, requestId: { fontSize: 11, fontWeight: "800" }, pendingPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 }, dot: { width: 7, height: 7, borderRadius: 4 }, customer: { textAlign: "right", fontSize: 19, fontWeight: "900" }, service: { textAlign: "right", fontSize: 13, fontWeight: "800" }, detailGrid: { flexDirection: "row", justifyContent: "flex-end", gap: 26 }, detail: { alignItems: "flex-end", gap: 3 }, detailLabel: { fontSize: 11 }, detailValue: { fontSize: 13, fontWeight: "800", textAlign: "right" }, note: { backgroundColor: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 9, textAlign: "right", fontSize: 12, lineHeight: 18 }, actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 3 }, approveButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }, approveText: { color: "#FFF", fontWeight: "900", fontSize: 12 }, rejectButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }, empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: 18, alignItems: "center", padding: 28, gap: 7 }, emptyTitle: { fontSize: 16, fontWeight: "900" }, processed: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }, processedIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }, processedText: { flex: 1, alignItems: "flex-end", gap: 3 }, processedName: { fontSize: 13, fontWeight: "800", textAlign: "right" } });
