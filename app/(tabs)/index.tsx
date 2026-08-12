import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLanguage } from "@/lib/i18n";

type MetricProps = { value: string; label: string; detail: string; tone?: "orange" | "mint" | "muted" };

const appointmentRows = [
  { client: "Maya K.", service: "Balayage + Gloss", time: "10:30 AM", status: "Confirmed", source: "WhatsApp", action: "View" },
  { client: "Rana Haddad", service: "Hydra Facial", time: "12:15 PM", status: "Note added", source: "Telegram", action: "Review" },
  { client: "Sarah N.", service: "Lash Lift", time: "2:00 PM", status: "Pending", source: "Website", action: "Approve" },
  { client: "Lina Saad", service: "Blow dry", time: "4:30 PM", status: "Confirmed", source: "WhatsApp", action: "View" },
];

function Metric({ value, label, detail, tone = "muted" }: MetricProps) {
  return <View style={[styles.metric, tone === "orange" && styles.metricOrange, tone === "mint" && styles.metricMint]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { language, setLanguage } = useLanguage();
  const [activeConversation, setActiveConversation] = useState<"maya" | "sarah">("maya");
  const isDesktop = width >= 940;
  const isWide = width >= 1180;
  const copy = language === "ar" ? {
    greeting: "صباح الخير، نادين.",
    subtitle: "كل ما يحتاجه مركزك لإدارة الحجوزات والعملاء والتواصل في مكان واحد.",
    action: "إضافة موعد",
    overview: "ملخص اليوم",
    crm: "مركز الحجوزات والعملاء",
    crmNote: "طلبات اليوم مرتبة حسب الإجراء التالي.",
    inbox: "محادثات العملاء",
    mobile: "تجربة العميلة على الهاتف",
    mobileBody: "من اختيار الخدمة إلى رسالة التأكيد — تجربة سلسة ومألوفة.",
    today: "مواعيد اليوم",
    confirmed: "تم التأكيد",
    pending: "بانتظار الموافقة",
    revenue: "إيراد متوقع",
    note: "تحتوي ملاحظة",
    client: "العميلة",
    service: "الخدمة",
    time: "الوقت",
    status: "الحالة",
    source: "القناة",
    next: "الإجراء",
  } : {
    greeting: "Good morning, Nadine.",
    subtitle: "Your salon’s bookings, clients, and conversations — coordinated in one calm workspace.",
    action: "Add appointment",
    overview: "Today at a glance",
    crm: "Bookings & client CRM",
    crmNote: "Today’s requests, organised by their next action.",
    inbox: "Client conversations",
    mobile: "Customer mobile experience",
    mobileBody: "A trusted path from service selection to confirmation.",
    today: "Appointments today",
    confirmed: "Confirmed",
    pending: "Awaiting approval",
    revenue: "Projected revenue",
    note: "Contains note",
    client: "Client",
    service: "Service",
    time: "Time",
    status: "Status",
    source: "Source",
    next: "Next action",
  };

  const conversation = activeConversation === "maya"
    ? { name: "Maya K.", initials: "MK", preview: "Perfect — see you on Thursday.", appointment: "Balayage · Thu, 10:30 AM", note: "Please keep the face-framing pieces soft." }
    : { name: "Sarah N.", initials: "SN", preview: "Is there a morning slot available?", appointment: "Lash lift · Fri, 11:00 AM", note: "Prefers a natural finish." };

  return <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-black">
    <ScrollView contentContainerStyle={[styles.page, { padding: isDesktop ? 28 : 16, flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.workspace, { maxWidth: 1420, alignSelf: "center" }]}>
        <View style={[styles.utilityBar, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
          <View style={styles.brandLockup}><View style={styles.brandMark}><Text style={styles.brandGlyph}>J</Text></View><View><Text style={styles.brandName}>JUST <Text style={styles.brandAccent}>beauty</Text></Text><Text style={styles.brandCaption}>SALON ASSISTANT</Text></View></View>
          <View style={[styles.utilityActions, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
            <View style={styles.languageControl}><Pressable onPress={() => setLanguage("ar")} style={[styles.languageButton, language === "ar" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "ar" && styles.languageTextActive]}>العربية</Text></Pressable><Pressable onPress={() => setLanguage("en")} style={[styles.languageButton, language === "en" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "en" && styles.languageTextActive]}>EN</Text></Pressable></View>
            <View style={styles.ownerAvatar}><Text style={styles.ownerAvatarText}>N</Text></View>
          </View>
        </View>

        <View style={[styles.hero, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
          <View style={[styles.heroCopy, { alignItems: language === "ar" ? "flex-end" : "flex-start" }]}>
            <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>SALON IS OPEN</Text></View>
            <Text style={[styles.heroTitle, { textAlign: language === "ar" ? "right" : "left" }]}>{copy.greeting}</Text>
            <Text style={[styles.heroBody, { textAlign: language === "ar" ? "right" : "left" }]}>{copy.subtitle}</Text>
            <Pressable onPress={() => router.push("/bookings")} style={styles.primaryAction}><Text style={styles.primaryActionText}>{copy.action}</Text><Text style={styles.primaryActionArrow}>{language === "ar" ? "←" : "→"}</Text></Pressable>
          </View>
          {isDesktop && <View style={styles.heroSignal}><Text style={styles.signalEyebrow}>JUST AI</Text><Text style={styles.signalValue}>92%</Text><Text style={styles.signalLabel}>of today’s clients replied within 12 minutes</Text><View style={styles.signalBars}><View style={[styles.signalBar, { height: 32 }]} /><View style={[styles.signalBar, { height: 52 }]} /><View style={[styles.signalBar, { height: 40 }]} /><View style={[styles.signalBar, { height: 68 }]} /><View style={[styles.signalBar, { height: 56 }]} /></View></View>}
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionKicker}>{copy.overview.toUpperCase()}</Text><Text style={styles.sectionMeta}>Tuesday, 13 August</Text></View>
        <View style={[styles.metricsGrid, !isDesktop && styles.metricsGridCompact]}>
          <Metric value="12" label={copy.today} detail="3 in the next 90 min" />
          <Metric value="8" label={copy.confirmed} detail="+2 since this morning" tone="mint" />
          <Metric value="3" label={copy.pending} detail="Needs your review" tone="orange" />
          <Metric value="$1,240" label={copy.revenue} detail="Based on booked services" />
        </View>

        <View style={[styles.mainGrid, { flexDirection: isWide ? (language === "ar" ? "row-reverse" : "row") : "column" }]}>
          <View style={styles.crmPanel}>
            <View style={[styles.panelHeader, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View><Text style={[styles.panelTitle, { textAlign: language === "ar" ? "right" : "left" }]}>{copy.crm}</Text><Text style={[styles.panelSub, { textAlign: language === "ar" ? "right" : "left" }]}>{copy.crmNote}</Text></View><Pressable onPress={() => router.push("/admin")} style={styles.subtleButton}><Text style={styles.subtleButtonText}>Open dashboard</Text></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}><View style={styles.crmTable}>
              <View style={styles.tableHeader}><Text style={[styles.tableHead, styles.clientCol]}>{copy.client}</Text><Text style={[styles.tableHead, styles.serviceCol]}>{copy.service}</Text><Text style={[styles.tableHead, styles.timeCol]}>{copy.time}</Text><Text style={[styles.tableHead, styles.statusCol]}>{copy.status}</Text><Text style={[styles.tableHead, styles.sourceCol]}>{copy.source}</Text><Text style={[styles.tableHead, styles.actionCol]}>{copy.next}</Text></View>
              {appointmentRows.map((row) => <View key={row.client} style={styles.tableRow}><View style={styles.clientCol}><View style={styles.clientInitial}><Text style={styles.clientInitialText}>{row.client.slice(0, 1)}</Text></View><View><Text style={styles.clientName}>{row.client}</Text>{row.status === "Note added" && <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>{copy.note}</Text></View>}</View></View><Text style={[styles.tableText, styles.serviceCol]}>{row.service}</Text><Text style={[styles.tableText, styles.timeCol]}>{row.time}</Text><View style={styles.statusCol}><View style={[styles.statusBadge, row.status === "Pending" && styles.statusPending, row.status === "Note added" && styles.statusNote]}><Text style={[styles.statusText, row.status === "Pending" && styles.statusTextPending]}>{row.status}</Text></View></View><Text style={[styles.tableText, styles.sourceCol]}>{row.source}</Text><Pressable style={styles.tableAction}><Text style={styles.tableActionText}>{row.action}</Text></Pressable></View>)}
            </View></ScrollView>
          </View>
          <View style={styles.insightsStack}>
            <View style={styles.insightCard}><Text style={styles.insightEyebrow}>AI FOLLOW-UP</Text><Text style={styles.insightTitle}>3 quiet conversations need a gentle nudge.</Text><Text style={styles.insightBody}>JUST AI has drafted follow-ups based on each client’s service and booking stage.</Text><Pressable onPress={() => router.push("/messages")} style={styles.inlineAction}><Text style={styles.inlineActionText}>Review drafts</Text><Text style={styles.inlineActionArrow}>→</Text></Pressable></View>
            <View style={styles.revenueCard}><Text style={styles.revenueEyebrow}>REVENUE SNAPSHOT</Text><Text style={styles.revenueTitle}>$860</Text><Text style={styles.revenueBody}>secured today from 8 confirmed appointments</Text><View style={styles.revenueLine}><View style={styles.revenueFill} /></View></View>
          </View>
        </View>

        <View style={[styles.bottomGrid, { flexDirection: isWide ? (language === "ar" ? "row-reverse" : "row") : "column" }]}>
          <View style={styles.inboxPanel}><View style={[styles.panelHeader, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View><Text style={[styles.panelTitle, { textAlign: language === "ar" ? "right" : "left" }]}>{copy.inbox}</Text><Text style={[styles.panelSub, { textAlign: language === "ar" ? "right" : "left" }]}>Your salon voice, always professional.</Text></View><View style={styles.unreadBubble}><Text style={styles.unreadText}>4</Text></View></View><View style={[styles.inboxContent, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View style={styles.threadList}><Pressable onPress={() => setActiveConversation("maya")} style={[styles.threadPreview, activeConversation === "maya" && styles.threadPreviewActive]}><View style={styles.threadAvatar}><Text style={styles.threadAvatarText}>MK</Text></View><View style={styles.threadWords}><Text style={styles.threadName}>Maya K.</Text><Text style={styles.threadText}>Perfect — see you Thursday.</Text></View></Pressable><Pressable onPress={() => setActiveConversation("sarah")} style={[styles.threadPreview, activeConversation === "sarah" && styles.threadPreviewActive]}><View style={[styles.threadAvatar, styles.threadAvatarAlt]}><Text style={styles.threadAvatarText}>SN</Text></View><View style={styles.threadWords}><Text style={styles.threadName}>Sarah N.</Text><Text style={styles.threadText}>Is there a morning slot?</Text></View></Pressable></View><View style={styles.chatPane}><View style={styles.chatClientHeader}><View><Text style={styles.chatName}>{conversation.name}</Text><Text style={styles.chatAppointment}>{conversation.appointment}</Text></View><View style={styles.chatAvatar}><Text style={styles.chatAvatarText}>{conversation.initials}</Text></View></View><View style={styles.incomingBubble}><Text style={styles.incomingText}>{conversation.preview}</Text><Text style={styles.messageTime}>10:42 AM</Text></View><View style={styles.outgoingBubble}><Text style={styles.outgoingText}>Thank you. Your request is with the manager now — I’ll update you shortly.</Text><Text style={styles.outgoingTime}>10:43 AM · ✓✓</Text></View><View style={styles.chatNote}><Text style={styles.chatNoteTitle}>CLIENT NOTE</Text><Text style={styles.chatNoteBody}>{conversation.note}</Text></View></View></View></View>
          <View style={styles.phoneShowcase}><Text style={styles.phoneKicker}>{copy.mobile.toUpperCase()}</Text><Text style={styles.phoneTitle}>{copy.mobile}</Text><Text style={styles.phoneBody}>{copy.mobileBody}</Text><View style={styles.phone}><View style={styles.phoneNotch} /><View style={styles.phoneScreen}><Text style={styles.phoneScreenBrand}>JUST beauty</Text><Text style={styles.phoneScreenTitle}>Your appointment is waiting for approval</Text><View style={styles.phoneBooking}><Text style={styles.phoneBookingLabel}>HYDRA FACIAL</Text><Text style={styles.phoneBookingName}>Thursday · 12:15 PM</Text><Text style={styles.phoneBookingMeta}>with Layan · 60 minutes</Text></View><View style={styles.phoneStatus}><View style={styles.phoneStatusDot} /><Text style={styles.phoneStatusText}>We’ll notify you via WhatsApp or Telegram.</Text></View></View></View></View>
        </View>
      </View>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#090909", minHeight: "100%" as unknown as number }, workspace: { width: "100%", gap: 18 }, utilityBar: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingVertical: 5 }, brandLockup: { flexDirection: "row", alignItems: "center", gap: 10 }, brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FF7A00", alignItems: "center", justifyContent: "center" }, brandGlyph: { color: "#0A0A0A", fontWeight: "900", fontSize: 21 }, brandName: { color: "#FFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.4 }, brandAccent: { color: "#FF7A00" }, brandCaption: { color: "#868686", fontSize: 8, fontWeight: "800", letterSpacing: 1.2, marginTop: 1 }, utilityActions: { alignItems: "center", gap: 12 }, languageControl: { flexDirection: "row", borderWidth: 1, borderColor: "#292929", borderRadius: 999, padding: 3, gap: 3 }, languageButton: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 }, languageButtonActive: { backgroundColor: "#FF7A00" }, languageText: { color: "#A4A4A4", fontSize: 10, fontWeight: "800" }, languageTextActive: { color: "#101010" }, ownerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#27201A", borderWidth: 1, borderColor: "#5A3C24", alignItems: "center", justifyContent: "center" }, ownerAvatarText: { color: "#FFC78C", fontSize: 13, fontWeight: "900" }, hero: { backgroundColor: "#151515", borderWidth: 1, borderColor: "#282828", borderRadius: 24, padding: 26, gap: 22, overflow: "hidden" }, heroCopy: { flex: 1, gap: 12, justifyContent: "center" }, livePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#2F2F2F", borderRadius: 999, backgroundColor: "#1C1C1C", paddingHorizontal: 9, paddingVertical: 5 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#69D5A3" }, liveText: { color: "#D5D5D5", fontSize: 9, fontWeight: "800", letterSpacing: 1 }, heroTitle: { color: "#FFF", fontSize: 34, lineHeight: 40, fontWeight: "900", letterSpacing: -1.1, maxWidth: 520 }, heroBody: { color: "#B8B8B8", fontSize: 14, lineHeight: 21, maxWidth: 520 }, primaryAction: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FF7A00", borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 }, primaryActionText: { color: "#151515", fontSize: 12, fontWeight: "900" }, primaryActionArrow: { color: "#151515", fontSize: 17, fontWeight: "900" }, heroSignal: { width: 270, minHeight: 185, backgroundColor: "#F3EEE8", borderRadius: 17, padding: 19, justifyContent: "flex-end" }, signalEyebrow: { color: "#7B746B", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, signalValue: { color: "#111", fontSize: 49, lineHeight: 53, letterSpacing: -2, fontWeight: "900", marginTop: 4 }, signalLabel: { color: "#524D46", fontSize: 11, lineHeight: 16, maxWidth: 170, marginTop: 3 }, signalBars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", gap: 5, position: "absolute", right: 18, bottom: 17 }, signalBar: { width: 8, borderRadius: 5, backgroundColor: "#FF7A00" }, sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }, sectionKicker: { color: "#FF9A42", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" }, sectionMeta: { color: "#777", fontSize: 11 }, metricsGrid: { flexDirection: "row", gap: 12 }, metricsGridCompact: { flexWrap: "wrap" }, metric: { flex: 1, minWidth: 145, backgroundColor: "#151515", borderColor: "#282828", borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 }, metricOrange: { backgroundColor: "#2C190B", borderColor: "#7D430A" }, metricMint: { backgroundColor: "#11231E", borderColor: "#285947" }, metricValue: { color: "#FFF", fontSize: 27, lineHeight: 32, fontWeight: "900", letterSpacing: -1 }, metricLabel: { color: "#EBEBEB", fontSize: 12, fontWeight: "800" }, metricDetail: { color: "#8E8E8E", fontSize: 10, marginTop: 3 }, mainGrid: { gap: 16 }, crmPanel: { flex: 1.55, backgroundColor: "#151515", borderColor: "#282828", borderWidth: 1, borderRadius: 19, padding: 18 }, insightsStack: { flex: 0.7, gap: 16 }, panelHeader: { alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 18 }, panelTitle: { color: "#F6F6F6", fontSize: 18, fontWeight: "900", letterSpacing: -0.3 }, panelSub: { color: "#8B8B8B", fontSize: 11, marginTop: 5 }, subtleButton: { borderColor: "#3B3B3B", borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, subtleButtonText: { color: "#F7A55B", fontSize: 10, fontWeight: "900" }, tableScroll: { paddingBottom: 2 }, crmTable: { minWidth: 660, flex: 1 }, tableHeader: { flexDirection: "row", alignItems: "center", borderBottomColor: "#2D2D2D", borderBottomWidth: 1, paddingBottom: 9 }, tableHead: { color: "#757575", fontSize: 9, letterSpacing: 0.6, fontWeight: "900", textTransform: "uppercase" }, tableRow: { flexDirection: "row", alignItems: "center", minHeight: 61, borderBottomColor: "#232323", borderBottomWidth: 1 }, clientCol: { width: 150, flexDirection: "row", alignItems: "center", gap: 8 }, serviceCol: { width: 155 }, timeCol: { width: 80 }, statusCol: { width: 105 }, sourceCol: { width: 90 }, actionCol: { width: 80 }, clientInitial: { width: 29, height: 29, borderRadius: 10, backgroundColor: "#2A211B", alignItems: "center", justifyContent: "center" }, clientInitialText: { color: "#FFC487", fontSize: 11, fontWeight: "900" }, clientName: { color: "#EEE", fontSize: 11, fontWeight: "800" }, noteBadge: { alignSelf: "flex-start", backgroundColor: "#33200F", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3, marginTop: 4 }, noteBadgeText: { color: "#FFB66D", fontSize: 7, fontWeight: "900" }, tableText: { color: "#B8B8B8", fontSize: 10 }, statusBadge: { alignSelf: "flex-start", backgroundColor: "#153025", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, statusPending: { backgroundColor: "#39200A" }, statusNote: { backgroundColor: "#292329" }, statusText: { color: "#81DFAD", fontSize: 9, fontWeight: "800" }, statusTextPending: { color: "#FFB56E" }, tableAction: { alignSelf: "flex-start", paddingVertical: 6 }, tableActionText: { color: "#FF8C26", fontSize: 10, fontWeight: "900" }, insightCard: { flex: 1, minHeight: 156, backgroundColor: "#FF7A00", borderRadius: 19, padding: 18, justifyContent: "space-between" }, insightEyebrow: { color: "#6B3200", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, insightTitle: { color: "#19110B", fontSize: 18, lineHeight: 22, fontWeight: "900", letterSpacing: -0.4, marginTop: 8 }, insightBody: { color: "#653C1E", fontSize: 11, lineHeight: 16, marginTop: 7 }, inlineAction: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 }, inlineActionText: { color: "#19110B", fontSize: 10, fontWeight: "900" }, inlineActionArrow: { color: "#19110B", fontSize: 15, fontWeight: "900" }, revenueCard: { backgroundColor: "#F3EEE8", borderRadius: 19, padding: 18, minHeight: 136 }, revenueEyebrow: { color: "#797269", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, revenueTitle: { color: "#191919", fontSize: 33, lineHeight: 37, fontWeight: "900", letterSpacing: -1.2, marginTop: 4 }, revenueBody: { color: "#736C63", fontSize: 10, marginTop: 3 }, revenueLine: { height: 6, borderRadius: 4, backgroundColor: "#D8D0C8", marginTop: 15, overflow: "hidden" }, revenueFill: { width: "72%", height: "100%", borderRadius: 4, backgroundColor: "#FF7A00" }, bottomGrid: { gap: 16 }, inboxPanel: { flex: 1.3, backgroundColor: "#151515", borderColor: "#282828", borderWidth: 1, borderRadius: 19, padding: 18 }, unreadBubble: { width: 23, height: 23, borderRadius: 12, backgroundColor: "#FF7A00", alignItems: "center", justifyContent: "center" }, unreadText: { color: "#171717", fontSize: 10, fontWeight: "900" }, inboxContent: { gap: 13 }, threadList: { width: 190, gap: 7 }, threadPreview: { flexDirection: "row", alignItems: "center", gap: 8, padding: 9, borderRadius: 11 }, threadPreviewActive: { backgroundColor: "#242424" }, threadAvatar: { width: 29, height: 29, borderRadius: 10, backgroundColor: "#482C1B", alignItems: "center", justifyContent: "center" }, threadAvatarAlt: { backgroundColor: "#29364A" }, threadAvatarText: { color: "#FFF", fontSize:9, fontWeight: "900" }, threadWords: { flex: 1, gap: 2 }, threadName: { color: "#EAEAEA", fontSize: 10, fontWeight: "900" }, threadText: { color: "#858585", fontSize: 9 }, chatPane: { flex: 1, minHeight: 195, backgroundColor: "#202020", borderRadius: 14, padding: 12 }, chatClientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomColor: "#323232", borderBottomWidth: 1, paddingBottom: 9 }, chatName: { color: "#F1F1F1", fontSize: 11, fontWeight: "900" }, chatAppointment: { color: "#939393", fontSize: 9, marginTop: 2 }, chatAvatar: { width: 26, height: 26, borderRadius: 9, backgroundColor: "#4D3020", alignItems: "center", justifyContent: "center" }, chatAvatarText: { color: "#FFD1A4", fontSize: 8, fontWeight: "900" }, incomingBubble: { alignSelf: "flex-start", backgroundColor: "#333333", borderRadius: 10, borderTopLeftRadius: 2, padding: 9, marginTop: 11, maxWidth: "84%" }, incomingText: { color: "#F3F3F3", fontSize: 10, lineHeight: 14 }, messageTime: { color: "#929292", fontSize: 7, marginTop: 4 }, outgoingBubble: { alignSelf: "flex-end", backgroundColor: "#5E3114", borderRadius: 10, borderTopRightRadius: 2, padding: 9, marginTop: 7, maxWidth: "88%" }, outgoingText: { color: "#FFE5CE", fontSize: 10, lineHeight: 14 }, outgoingTime: { color: "#E7A26B", fontSize: 7, marginTop: 4, textAlign: "right" }, chatNote: { marginTop: 9, borderLeftColor: "#FF7A00", borderLeftWidth: 2, paddingLeft: 7 }, chatNoteTitle: { color: "#FF9E49", fontSize: 8, letterSpacing: 0.8, fontWeight: "900" }, chatNoteBody: { color: "#ADADAD", fontSize: 9, marginTop: 3 }, phoneShowcase: { flex: 0.7, minHeight: 330, backgroundColor: "#F3EEE8", borderRadius: 19, padding: 20, alignItems: "flex-start", overflow: "hidden" }, phoneKicker: { color: "#A26B38", fontSize: 9, fontWeight: "900", letterSpacing: 0.9 }, phoneTitle: { color: "#171717", fontSize: 20, lineHeight: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 6, maxWidth: 210 }, phoneBody: { color: "#6F665D", fontSize: 10, lineHeight: 15, marginTop: 6, maxWidth: 210 }, phone: { width: 184, height: 285, backgroundColor: "#101010", borderRadius: 26, padding: 6, marginTop: 14, alignSelf: "center", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18 }, phoneNotch: { position: "absolute", zIndex: 2, alignSelf: "center", width: 73, height: 16, backgroundColor: "#101010", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }, phoneScreen: { flex: 1, backgroundColor: "#F9F5F1", borderRadius: 21, padding: 15, paddingTop: 29 }, phoneScreenBrand: { color: "#171717", fontSize: 9, fontWeight: "900" }, phoneScreenTitle: { color: "#24211F", fontSize: 15, lineHeight: 19, fontWeight: "900", marginTop: 12 }, phoneBooking: { backgroundColor: "#FFF", borderRadius: 10, padding: 10, marginTop: 14, shadowColor: "#3A2C21", shadowOpacity: 0.08, shadowRadius: 7 }, phoneBookingLabel: { color: "#E56B00", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, phoneBookingName: { color: "#222", fontSize: 9, fontWeight: "900", marginTop: 5 }, phoneBookingMeta: { color: "#766E68", fontSize: 8, marginTop: 4 }, phoneStatus: { flexDirection: "row", gap: 5, alignItems: "flex-start", marginTop: 13 }, phoneStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF7A00", marginTop: 3 }, phoneStatusText: { color: "#736B65", flex: 1, fontSize: 8, lineHeight: 11 },
});
