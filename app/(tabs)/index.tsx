import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLanguage } from "@/lib/i18n";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";

function CrmRequestError({
  onRetry,
  busy,
  ar,
  color,
}: {
  onRetry: () => void;
  busy: boolean;
  ar: boolean;
  color: string;
}) {
  return (
    <View accessibilityRole="alert" style={styles.empty}>
      <Text style={[styles.cardTitle, { color }]}>
        {ar ? "تعذر تحميل بيانات المركز" : "We couldn’t load your salon"}
      </Text>
      <Text style={styles.muted}>
        {ar
          ? "تحققي من الاتصال وأعيدي المحاولة."
          : "Check your connection and try again."}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        onPress={onRetry}
        style={[styles.button, busy && styles.retryActionDisabled]}
      >
        <Text style={styles.buttonText}>
          {ar ? "إعادة المحاولة" : "Try again"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { language, setLanguage } = useLanguage();
  const { colorScheme, setColorScheme } = useThemeContext();
  const ar = language === "ar";
  const light = colorScheme === "light";
  const session = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAdmin = session.data?.role === "admin";
  const dashboardQuery = trpc.dashboard.overview.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30000,
    retry: false,
  });
  const activity = trpc.bookings.activity.useQuery(undefined, {
    enabled: !!session.data && !isAdmin,
    retry: false,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const palette = light
    ? {
        page: "#F7F3EE",
        surface: "#FFFFFF",
        text: "#221D19",
        border: "#E6DED5",
        muted: "#70675F",
      }
    : {
        page: "#0B0C0C",
        surface: "#171919",
        text: "#F5F1EB",
        border: "#303333",
        muted: "#AAA59E",
      };
  const rtl = { textAlign: ar ? ("right" as const) : ("left" as const) };
  const row = {
    flexDirection: ar ? ("row-reverse" as const) : ("row" as const),
  };
  const metrics = dashboardQuery.data?.metrics;
  const hasLiveRequestError =
    dashboardQuery.isError || dashboardQuery.data?.databaseAvailable === false;
  const rows = (dashboardQuery.data?.rows ?? []).filter(
    (item) =>
      (filter === "all" || item.status === filter) &&
      `${item.client} ${item.service ?? ""}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const statuses: Record<string, string> = ar
    ? {
        pending: "بانتظار الموافقة",
        approved: "مؤكد",
        rejected: "مرفوض",
        cancelled: "ملغى",
        rescheduled: "أُعيدت جدولته",
      }
    : {
        pending: "Pending",
        approved: "Confirmed",
        rejected: "Declined",
        cancelled: "Cancelled",
        rescheduled: "Rescheduled",
      };
  const date = (value: string) =>
    new Date(value).toLocaleString(ar ? "ar-LB" : "en-GB", {
      timeZone: "Asia/Beirut",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const action = (
    label: string,
    route: "/bookings" | "/login" | "/admin" | "/messages",
  ) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route)}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{label}</Text>
      <Text style={styles.buttonText}>{ar ? "←" : "→"}</Text>
    </Pressable>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={dashboardQuery.isRefetching || activity.isRefetching}
            onRefresh={() => {
              session.refetch();
              if (isAdmin) dashboardQuery.refetch();
              else if (session.data) activity.refetch();
            }}
            tintColor="#FF850A"
          />
        }
        contentContainerStyle={[
          styles.page,
          { backgroundColor: palette.page, padding: width < 600 ? 18 : 36 },
        ]}
      >
        <View style={styles.workspace}>
          <View style={[styles.toolbar, row]}>
            <View>
              <Text style={[styles.brand, { color: palette.text }]}>
                JUST <Text style={{ color: "#FF850A" }}>beauty</Text>
              </Text>
              <Text style={styles.eyebrow}>SALON WORKSPACE</Text>
            </View>
            <View style={[styles.controls, row]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  ar ? "Switch to English" : "التبديل للعربية"
                }
                onPress={() => setLanguage(ar ? "en" : "ar")}
                style={[styles.control, { borderColor: palette.border }]}
              >
                <Text style={{ color: palette.text }}>
                  {ar ? "EN" : "العربية"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ar ? "تغيير المظهر" : "Change appearance"}
                onPress={() => setColorScheme(light ? "dark" : "light")}
                style={[styles.control, { borderColor: palette.border }]}
              >
                <Text style={{ color: palette.text }}>{light ? "◐" : "☀"}</Text>
              </Pressable>
            </View>
          </View>
          <View
            style={[
              styles.hero,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.eyebrow, rtl, { color: "#D97309" }]}>
              {ar ? "مساحة ليوم أهدأ" : "A LITTLE MORE ROOM TO BREATHE"}
            </Text>
            <Text
              style={[
                styles.title,
                rtl,
                { color: palette.text, fontSize: width < 600 ? 32 : 48 },
              ]}
            >
              {ar ? "صالونك، بانسيابية." : "Your salon, in flow."}
            </Text>
            <Text style={[styles.body, rtl, { color: palette.muted }]}>
              {ar
                ? "المواعيد والعملاء والخطوة التالية، في مساحة واحدة واضحة."
                : "Appointments, client care, and your next step. All in one clear workspace."}
            </Text>
            <View style={[styles.toolbar, row, { marginTop: 10 }]}>
              {action(
                ar ? "موعد جديد" : "New appointment",
                session.data ? "/bookings" : "/login",
              )}
              <Text style={[styles.muted, { flexShrink: 1 }]}>
                {new Date().toLocaleDateString(ar ? "ar-LB" : "en-GB", {
                  timeZone: "Asia/Beirut",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </View>
          </View>
          {session.isLoading ? (
            <Text
              accessibilityState={{ busy: true }}
              style={[styles.muted, { color: palette.muted }]}
            >
              {ar ? "جارٍ التحقق من الحساب…" : "Checking your account…"}
            </Text>
          ) : session.isError ? (
            <CrmRequestError
              ar={ar}
              color={palette.text}
              busy={session.isFetching}
              onRetry={() => session.refetch()}
            />
          ) : !session.data ? (
            <View
              style={[
                styles.panel,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, rtl, { color: palette.text }]}>
                {ar ? "أهلاً بك في مركزك" : "Welcome to your workspace"}
              </Text>
              <Text style={[styles.body, rtl, { color: palette.muted }]}>
                {ar
                  ? "سجّلي الدخول لحفظ مواعيدك والوصول إلى محادثاتك بأمان."
                  : "Sign in to save appointments and securely access your conversations."}
              </Text>
              {action(ar ? "تسجيل الدخول" : "Sign in", "/login")}
            </View>
          ) : isAdmin ? (
            <>
              <View style={[styles.toolbar, row]}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>
                  {ar ? "نظرة على اليوم" : "Today at a glance"}
                </Text>
                <Text style={[styles.muted, { color: palette.muted }]}>
                  {dashboardQuery.data && !hasLiveRequestError
                    ? (ar ? "آخر تحديث " : "Updated ") +
                      new Date(
                        dashboardQuery.data.generatedAt,
                      ).toLocaleTimeString(ar ? "ar-LB" : "en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </Text>
              </View>
              <View style={[styles.metrics, row]}>
                {[
                  [
                    ar ? "مواعيد اليوم" : "Appointments",
                    metrics?.appointmentsToday,
                  ],
                  [ar ? "مؤكدة" : "Confirmed", metrics?.confirmed],
                  [ar ? "للمراجعة" : "To review", metrics?.pending],
                ].map(([label, value], index) => (
                  <View
                    key={String(label)}
                    style={[
                      styles.metric,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                        minWidth: width < 600 ? 85 : 170,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.metricValue,
                        { color: index === 2 ? "#E78017" : palette.text },
                      ]}
                    >
                      {dashboardQuery.isLoading || hasLiveRequestError
                        ? "—"
                        : (value ?? "—")}
                    </Text>
                    <Text
                      style={[styles.metricLabel, rtl, { color: palette.text }]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              <View
                style={[
                  styles.panel,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={[styles.toolbar, row]}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.cardTitle, rtl, { color: palette.text }]}
                    >
                      {ar ? "المواعيد والعملاء" : "Appointments & clients"}
                    </Text>
                    <Text style={[styles.muted, rtl]}>
                      {ar ? "أحدث الحجوزات المحفوظة" : "Latest saved bookings"}
                    </Text>
                  </View>
                  {action(ar ? "إدارة" : "Manage", "/admin")}
                </View>
                <TextInput
                  accessibilityLabel={
                    ar ? "البحث عن عميلة أو خدمة" : "Search client or service"
                  }
                  placeholder={
                    ar ? "ابحثي عن عميلة أو خدمة…" : "Search client or service…"
                  }
                  placeholderTextColor="#8E8B85"
                  value={search}
                  onChangeText={setSearch}
                  style={[
                    styles.search,
                    rtl,
                    { color: palette.text, borderColor: palette.border },
                  ]}
                />
                <View style={[styles.controls, row]}>
                  {["all", "pending", "approved"].map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: filter === value }}
                      onPress={() => setFilter(value)}
                      style={[
                        styles.chip,
                        {
                          borderColor:
                            filter === value ? "#FF850A" : palette.border,
                          backgroundColor:
                            filter === value ? "#FF850A18" : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: filter === value ? "#D97309" : palette.text,
                          fontWeight: "600",
                        }}
                      >
                        {value === "all"
                          ? ar
                            ? "الكل"
                            : "All"
                          : statuses[value]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {dashboardQuery.isLoading ? (
                  <View
                    accessibilityState={{ busy: true }}
                    style={styles.empty}
                  >
                    <Text style={[styles.muted, { color: palette.muted }]}>
                      {ar ? "جارٍ تحميل المواعيد…" : "Loading appointments…"}
                    </Text>
                  </View>
                ) : hasLiveRequestError ? (
                  <CrmRequestError
                    ar={ar}
                    color={palette.text}
                    busy={dashboardQuery.isRefetching}
                    onRetry={() => dashboardQuery.refetch()}
                  />
                ) : rows.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={[styles.cardTitle, { color: palette.text }]}>
                      {ar
                        ? "لا توجد مواعيد مطابقة"
                        : "No matching appointments"}
                    </Text>
                    <Text style={[styles.muted, { textAlign: "center" }]}>
                      {ar
                        ? "ستظهر الحجوزات المحفوظة هنا. جرّبي تغيير البحث أو الفلتر."
                        : "Saved bookings appear here. Try changing your search or filter."}
                    </Text>
                  </View>
                ) : (
                  rows.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${item.client}, ${item.service}, ${statuses[item.status]}`}
                      key={item.id}
                      onPress={() => router.push("/admin")}
                      style={[styles.booking, { borderColor: palette.border }]}
                    >
                      <View style={[styles.toolbar, row]}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: palette.text, flex: 1 },
                            rtl,
                          ]}
                        >
                          {item.client}
                        </Text>
                        <View style={styles.badge}>
                          <Text
                            style={{
                              color: "#D97309",
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            {statuses[item.status]}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.body, rtl, { color: palette.text }]}>
                        {item.service ?? "—"}
                      </Text>
                      <View style={[styles.toolbar, row]}>
                        <Text style={[styles.muted, { color: palette.muted }]}>
                          {item.appointmentAtISO
                            ? date(item.appointmentAtISO)
                            : "—"}
                        </Text>
                        <Text style={[styles.muted, { color: palette.muted }]}>
                          {item.contactChannel}
                        </Text>
                      </View>
                      {item.hasCustomerNote && (
                        <Text style={[styles.muted, rtl]}>
                          {ar
                            ? "تحتوي ملاحظة من العميلة"
                            : "Client note attached"}
                        </Text>
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            </>
          ) : (
            <View
              style={[
                styles.panel,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.cardTitle, rtl, { color: palette.text }]}>
                {ar ? "آخر موعد لك" : "Your latest appointment"}
              </Text>
              {activity.isLoading ? (
                <Text style={[styles.muted, { color: palette.muted }]}>
                  {ar ? "جارٍ التحميل…" : "Loading…"}
                </Text>
              ) : activity.isError ||
                activity.data?.databaseAvailable === false ? (
                <CrmRequestError
                  ar={ar}
                  color={palette.text}
                  busy={activity.isRefetching}
                  onRetry={() => activity.refetch()}
                />
              ) : activity.data?.appointment ? (
                <>
                  <Text style={[styles.body, rtl, { color: palette.text }]}>
                    {activity.data.appointment.serviceName}
                  </Text>
                  <Text style={[styles.body, rtl, { color: palette.muted }]}>
                    {date(activity.data.appointment.appointmentAtISO)} ·{" "}
                    {statuses[activity.data.appointment.status]}
                  </Text>
                </>
              ) : (
                <Text style={[styles.body, rtl, { color: palette.muted }]}>
                  {ar
                    ? "لا توجد مواعيد محفوظة بعد. لنبدأ بحجزك الأول."
                    : "No saved appointments yet. Let’s book your first visit."}
                </Text>
              )}
              {action(ar ? "عرض مواعيدي" : "View my bookings", "/bookings")}
            </View>
          )}
          <View
            style={[
              styles.panel,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.eyebrow, rtl]}>
              {ar ? "الخطوة التالية" : "KEEP THE CONVERSATION GOING"}
            </Text>
            <Text style={[styles.cardTitle, rtl, { color: palette.text }]}>
              {ar ? "اهتمام يبدأ قبل الزيارة" : "Care starts before the visit"}
            </Text>
            <Text style={[styles.body, rtl, { color: palette.muted }]}>
              {ar
                ? "راجعي محادثاتك وتفاصيل الخدمة في مكان واحد."
                : "Find your saved conversations and service details in one place."}
            </Text>
            {action(
              ar ? "فتح المحادثات" : "Open conversations",
              session.data ? "/messages" : "/login",
            )}
          </View>
          <Text style={[styles.footer, rtl]}>
            {ar
              ? "الأوقات بتوقيت بيروت · بيانات من الحجوزات المحفوظة"
              : "Times in Beirut · Figures from saved bookings"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1 },
  workspace: { width: "100%", maxWidth: 1180, alignSelf: "center", gap: 22 },
  toolbar: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  brand: { fontSize: 25, fontWeight: "900", letterSpacing: -1 },
  eyebrow: {
    color: "#8E8B85",
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  controls: { gap: 8, alignItems: "center", flexWrap: "wrap" },
  control: {
    borderWidth: 1,
    minWidth: 44,
    minHeight: 44,
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 24,
    gap: 14,
    borderTopColor: "#FF850A",
    borderTopWidth: 3,
  },
  title: { fontWeight: "800", letterSpacing: -1.3 },
  body: { fontSize: 15, lineHeight: 24, color: "#8E8B85" },
  muted: { fontSize: 12, lineHeight: 20, color: "#8E8B85" },
  button: {
    minHeight: 46,
    backgroundColor: "#FF850A",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "flex-start",
  },
  buttonText: { color: "#211407", fontSize: 13, fontWeight: "800" },
  retryActionDisabled: { opacity: 0.5 },
  metrics: { gap: 10 },
  metric: { flex: 1, padding: 16, borderRadius: 18, borderWidth: 1, gap: 6 },
  metricValue: { fontSize: 32, fontWeight: "800" },
  metricLabel: { fontSize: 12, lineHeight: 18 },
  panel: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 16 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  search: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    fontSize: 14,
    minHeight: 48,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
  },
  booking: { borderTopWidth: 1, paddingVertical: 18, gap: 8 },
  badge: {
    borderRadius: 20,
    backgroundColor: "#FF850A15",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  empty: { paddingVertical: 28, gap: 12, alignItems: "center" },
  footer: { color: "#8E8B85", fontSize: 11, paddingBottom: 14 },
});
