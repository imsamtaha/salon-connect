import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, useWindowDimensions } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const bottomPadding = Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarPosition: isDesktopWeb ? "left" : "bottom",
    tabBarActiveTintColor: isDesktopWeb ? "#FF7A00" : colors.primary,
    tabBarInactiveTintColor: isDesktopWeb ? "#9A9A9A" : colors.muted,
    tabBarButton: HapticTab,
    tabBarLabelStyle: { fontSize: isDesktopWeb ? 13 : 10, fontWeight: "700" },
    tabBarStyle: isDesktopWeb
      ? { width: 224, paddingTop: 28, paddingHorizontal: 12, backgroundColor: "#090909", borderRightColor: "#282828", borderRightWidth: 1 }
      : { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 },
    tabBarItemStyle: isDesktopWeb ? { borderRadius: 12, marginVertical: 4, minHeight: 48 } : undefined,
  }}>
    <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ color }) => <IconSymbol size={23} name="house.fill" color={color} /> }} />
    <Tabs.Screen name="bookings" options={{ title: "مواعيدي", tabBarIcon: ({ color }) => <IconSymbol size={23} name="calendar" color={color} /> }} />
    <Tabs.Screen name="messages" options={{ title: "المحادثات", tabBarIcon: ({ color }) => <IconSymbol size={23} name="message" color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: "حسابي", tabBarIcon: ({ color }) => <IconSymbol size={23} name="person" color={color} /> }} />
    <Tabs.Screen name="admin" options={{ title: "إدارة المركز", tabBarIcon: ({ color }) => <IconSymbol size={23} name="person" color={color} /> }} />
  </Tabs>;
}
