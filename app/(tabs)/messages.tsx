import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ShimmerBlock } from "@/components/shimmer-block";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useThemeContext } from "@/lib/theme-provider";

export default function MessagesScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const { colorScheme } = useThemeContext();
  const conversationsQuery = trpc.conversations.feed.useQuery(undefined, { retry: false });
  const conversations = conversationsQuery.data?.threads ?? [];
  const isLoading = conversationsQuery.isLoading;
  const hasLiveRequestError = conversationsQuery.isError || conversationsQuery.data?.databaseAvailable === false;
  const noteSurface = colorScheme === "dark" ? "#34250F" : "#FFF8E8";
  const noteBorder = colorScheme === "dark" ? "#75521E" : "#F2D79B";
  const skeletonBase = colorScheme === "dark" ? "#303235" : "#E8E7E3";
  const skeletonHighlight = colorScheme === "dark" ? "#45484C" : "#F5F3EF";
  const errorCopy = language === "ar"
    ? { title: "تعذر تحميل المحادثات", body: "تحققي من الاتصال ثم أعيدي المحاولة لعرض رسائل المركز.", retry: "إعادة المحاولة", retrying: "جارٍ إعادة المحاولة…" }
    : { title: "Conversations could not be loaded", body: "Check your connection, then try again to see messages from the center.", retry: "Try again", retrying: "Retrying…" };

  return <ScreenContainer className="px-5 pt-4"><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>MESSAGES</Text><Text style={[styles.title, { color: colors.foreground }]}>المحادثات</Text>
    {isLoading ? <MessageListSkeleton base={skeletonBase} highlight={skeletonHighlight} /> : hasLiveRequestError ? <ConversationRequestError title={errorCopy.title} body={errorCopy.body} retryLabel={errorCopy.retry} retryingLabel={errorCopy.retrying} isRetrying={conversationsQuery.isRefetching} onRetry={() => conversationsQuery.refetch()} colors={colors} colorScheme={colorScheme} /> : conversations.length > 0 ? conversations.map((thread) => <Pressable key={thread.id} onPress={() => Alert.alert(thread.name, "سيتم ربط الرسائل بموعدك عند تفعيل حساب الصالون.")} style={[styles.thread, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{thread.initial}</Text></View><View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{thread.name}</Text><Text style={[styles.preview, { color: colors.muted }]}>{thread.preview}</Text></View><Text style={[styles.time, { color: colors.muted }]}>{thread.updatedAtISO ? new Date(thread.updatedAtISO).toLocaleTimeString(language === "ar" ? "ar-LB" : "en-US", { hour: "numeric", minute: "2-digit" }) : ""}</Text></Pressable>) : <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: noteSurface }]}><Text style={[styles.emptyIconText, { color: colors.primary }]}>✦</Text></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد محادثات بعد</Text><Text style={[styles.emptyBody, { color: colors.muted }]}>عند إرسال طلب حجز أو تلقي تحديث من المركز، ستظهر المحادثة هنا.</Text><Pressable onPress={() => Alert.alert("ابدئي الحجز", "انتقلي إلى صفحة المواعيد لإرسال أول طلب إلى المركز.")} style={[styles.emptyAction, { backgroundColor: colors.primary }]}><Text style={styles.emptyActionText}>ابدئي طلب حجز</Text></Pressable></View>}
    <View style={[styles.note, { backgroundColor: noteSurface, borderColor: noteBorder }]}><Text style={[styles.noteText, { color: colorScheme === "dark" ? "#F5C978" : "#765A1D" }]}>المحادثة الداخلية تعمل حتى عند عدم ربط واتساب أو تيليغرام.</Text></View>
  </ScrollView></ScreenContainer>;
}

function ConversationRequestError({ title, body, retryLabel, retryingLabel, isRetrying, onRetry, colors, colorScheme }: { title: string; body: string; retryLabel: string; retryingLabel: string; isRetrying: boolean; onRetry: () => void; colors: ReturnType<typeof useColors>; colorScheme: "light" | "dark" }) {
  const isLight = colorScheme === "light";
  return <View accessibilityRole="alert" style={[styles.requestError, { backgroundColor: isLight ? "#FFF9F6" : "#211513", borderColor: isLight ? "#E7C3B8" : "#5A2A25" }]}><View style={[styles.emptyIcon, { backgroundColor: isLight ? "#FDE9E2" : "#3B1D19" }]}><Text style={[styles.emptyIconText, { color: isLight ? "#B33A25" : "#FF9D87" }]}>!</Text></View><Text style={[styles.emptyTitle, { color: isLight ? "#4A1E17" : "#FFD8CF" }]}>{title}</Text><Text style={[styles.emptyBody, { color: isLight ? "#805C55" : "#CBA9A2" }]}>{body}</Text><Pressable accessibilityRole="button" accessibilityState={{ busy: isRetrying, disabled: isRetrying }} disabled={isRetrying} onPress={onRetry} style={[styles.retryAction, { backgroundColor: colors.primary }, isRetrying && styles.retryActionDisabled]}><Text style={styles.retryActionText}>{isRetrying ? retryingLabel : retryLabel}</Text></Pressable></View>;
}

function MessageListSkeleton({ base, highlight }: { base: string; highlight: string }) {
  return <View style={styles.skeletonList} accessibilityLabel="Loading conversations" accessibilityState={{ busy: true }}>{[0, 1].map((index) => <View key={index} style={[styles.skeletonThread, { borderColor: base }]}><ShimmerBlock style={styles.skeletonAvatar} baseColor={base} highlightColor={highlight} /><View style={styles.skeletonCopy}><ShimmerBlock style={[styles.skeletonLine, styles.skeletonLinePrimary]} baseColor={base} highlightColor={highlight} /><ShimmerBlock style={[styles.skeletonLine, styles.skeletonLineSecondary]} baseColor={base} highlightColor={highlight} /></View></View>)}</View>;
}

const styles = StyleSheet.create({
  content: { gap: 15, paddingBottom: 30 }, eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: "800", textAlign: "right" }, title: { fontSize: 29, fontWeight: "800", textAlign: "right", marginBottom: 5 },
  thread: { flexDirection: "row-reverse", alignItems: "center", gap: 11, padding: 14, borderWidth: 1, borderRadius: 18 }, avatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFF", fontSize: 20, fontWeight: "800" }, copy: { flex: 1, alignItems: "flex-end", gap: 4 }, name: { fontSize: 15, fontWeight: "800" }, preview: { fontSize: 12 }, time: { fontSize: 11 },
  note: { padding: 14, borderRadius: 16, borderWidth: 1 }, noteText: { textAlign: "right", fontSize: 12, lineHeight: 19 },
  skeletonList: { gap: 10 }, skeletonThread: { flexDirection: "row-reverse", alignItems: "center", gap: 11, padding: 14, borderWidth: 1, borderRadius: 18 }, skeletonAvatar: { width: 46, height: 46, borderRadius: 16 }, skeletonCopy: { flex: 1, alignItems: "flex-end", gap: 8 }, skeletonLine: { height: 10, borderRadius: 99 }, skeletonLinePrimary: { width: "42%" }, skeletonLineSecondary: { width: "78%" },
  emptyCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 26, alignItems: "center", gap: 9 }, emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center" }, emptyIconText: { fontSize: 20, fontWeight: "900" }, emptyTitle: { fontSize: 17, fontWeight: "900", textAlign: "center" }, emptyBody: { fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 270 }, emptyAction: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 3 }, emptyActionText: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  requestError: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 26, alignItems: "center", gap: 9 }, retryAction: { minWidth: 110, alignItems: "center", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginTop: 3 }, retryActionDisabled: { opacity: 0.62 }, retryActionText: { color: "#FFF", fontSize: 12, fontWeight: "900" },
});
