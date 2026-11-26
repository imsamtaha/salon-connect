import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { RaisedButton } from "@/components/raised-button";
import { type Language } from "@/lib/i18n";

const NOTES_KEY = "mawaidi-home-notes";
const WORK_EMAIL = "info@justai-atlas.online";

const copy = {
  ar: {
    notes: "ملاحظات",
    placeholder: "اكتبي ملاحظة هنا…",
    local: "تُحفَظ ملاحظاتك على هذا الجهاز.",
    save: "حفظ الملاحظات",
    saving: "جارٍ الحفظ…",
    saved: "تم الحفظ.",
    loadError: "تعذّر تحميل الملاحظات المحفوظة.",
    saveError: "تعذّر حفظ الملاحظات. حاولي مرة أخرى.",
    about: "من نحن",
    description: "طوّرنا مواعيدي في JUST AI لتسهيل طلب مواعيد التجميل ومساعدة المراكز على إدارة الحجوزات ومتابعتها.",
    contact: "للتواصل بشأن العمل",
  },
  en: {
    notes: "Notes",
    placeholder: "Write a note…",
    local: "Your notes are saved on this device.",
    save: "Save notes",
    saving: "Saving…",
    saved: "Saved.",
    loadError: "Your saved notes could not be loaded.",
    saveError: "Your notes could not be saved. Try again.",
    about: "About us",
    description: "We built مواعيدي at JUST AI so clients can easily request beauty appointments and salons can manage and track bookings.",
    contact: "Work inquiries",
  },
};

type HomeFooterProps = {
  language: Language;
  isWide: boolean;
  isLight: boolean;
  palette: { page: string; surface: string; border: string; title: string; body: string };
};

export function HomeFooter({ language, isWide, isLight, palette }: HomeFooterProps) {
  const text = copy[language];
  const isArabic = language === "ar";
  const alignment = { textAlign: isArabic ? "right" as const : "left" as const };
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "loadError" | "saveError">("loading");

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(NOTES_KEY).then((stored) => {
      if (!mounted) return;
      setNote(stored ?? "");
      setSavedNote(stored ?? "");
      setStatus("idle");
    }).catch(() => {
      if (mounted) setStatus("loadError");
    });
    return () => { mounted = false; };
  }, []);

  async function saveNote() {
    setStatus("saving");
    try {
      await AsyncStorage.setItem(NOTES_KEY, note);
      setSavedNote(note);
      setStatus("saved");
    } catch {
      setStatus("saveError");
    }
  }

  const isBusy = status === "loading" || status === "saving";
  const saveDisabled = isBusy || savedNote === note;
  const feedback = status === "saved" || status === "loadError" || status === "saveError" ? text[status] : "";
  const linkColor = isLight ? "#983D00" : "#FFB474";

  return (
    <View style={[
      styles.footer,
      { backgroundColor: palette.surface, borderColor: palette.border, direction: isArabic ? "rtl" : "ltr" },
      isWide && styles.columns,
    ]}>
      <View style={[styles.section, isWide && styles.column]}>
        <Text accessibilityRole="header" style={[styles.heading, alignment, { color: palette.title }]}>{text.notes}</Text>
        <Text style={[styles.body, alignment, { color: palette.body }]}>{text.local}</Text>
        <TextInput
          accessibilityLabel={text.notes}
          editable={!isBusy}
          multiline
          onChangeText={(value) => {
            setNote(value);
            setStatus("idle");
          }}
          placeholder={text.placeholder}
          placeholderTextColor={palette.body}
          style={[styles.input, alignment, { backgroundColor: palette.page, borderColor: palette.border, color: palette.title }]}
          value={note}
        />
        <RaisedButton
          accessibilityState={{ busy: status === "saving", disabled: saveDisabled }}
          disabled={saveDisabled}
          onPress={saveNote}
          style={[styles.save, saveDisabled && styles.disabled]}
          tone="orange"
        >
          <Text style={styles.saveText}>{status === "saving" ? text.saving : text.save}</Text>
        </RaisedButton>
        {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.body, alignment, { color: palette.body }]}>{feedback}</Text> : null}
      </View>
      <View style={[styles.section, isWide && styles.column]}>
        <Text accessibilityRole="header" style={[styles.heading, alignment, { color: palette.title }]}>{text.about}</Text>
        <Text style={[styles.body, alignment, { color: palette.body }]}>{text.description}</Text>
        <Text style={[styles.contact, alignment, { color: palette.title }]}>{text.contact}</Text>
        <Link href={`mailto:${WORK_EMAIL}`} style={[styles.email, { color: linkColor }]}>{WORK_EMAIL}</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderWidth: 1, borderRadius: 19, padding: 18, gap: 24 },
  columns: { flexDirection: "row" },
  section: { minWidth: 0, gap: 8 },
  column: { flex: 1 },
  heading: { fontSize: 18, fontWeight: "900" },
  body: { fontSize: 16, lineHeight: 24 },
  input: { minHeight: 100, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, textAlignVertical: "top" },
  save: { alignSelf: "flex-start", minHeight: 44, backgroundColor: "#FF7A00", borderRadius: 10, justifyContent: "center", paddingHorizontal: 14 },
  disabled: { opacity: 0.52 },
  saveText: { color: "#151515", fontSize: 14, fontWeight: "900" },
  contact: { fontSize: 14, fontWeight: "800", marginTop: 6 },
  email: { alignSelf: "flex-start", fontSize: 16, fontWeight: "700", textDecorationLine: "underline", writingDirection: "ltr" },
});
