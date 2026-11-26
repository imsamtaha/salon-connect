import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";

type RaisedButtonProps = PressableProps & { tone?: "neutral" | "primary" | "orange" };

export function RaisedButton({ tone = "neutral", style, ...props }: RaisedButtonProps) {
  const { colorScheme } = useThemeContext();
  const isLight = colorScheme === "light";
  const edgeColors = {
    neutral: isLight ? "#BAAFA4" : "#505050",
    primary: isLight ? "#084C46" : "#14796D",
    orange: "#A44800",
  };

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [
        styles.face,
        { backgroundColor: isLight ? "#FFFFFF" : "#242424" },
        typeof style === "function" ? style(state) : style,
        {
          boxShadow: `0px ${state.pressed ? 1 : 4}px 0px ${edgeColors[tone]}`,
          transform: [{ translateY: state.pressed ? 3 : 0 }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  face: { borderRadius: 10, marginBottom: 4 },
});
