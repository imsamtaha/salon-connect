import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";

type ShimmerBlockProps = {
  style?: StyleProp<ViewStyle>;
  baseColor: string;
  highlightColor: string;
};

/**
 * A lightweight skeleton surface for native and web. Motion is paused when the
 * operating system asks to reduce animation, preserving a static loading cue.
 */
export function ShimmerBlock({ style, baseColor, highlightColor }: ShimmerBlockProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
      progress.stopAnimation();
    };
  }, [progress]);

  useEffect(() => {
    if (reduceMotion || width === 0) return;
    progress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1350,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion, width]);

  const highlightWidth = Math.max(width * 0.54, 46);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-highlightWidth, width],
  });

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View accessible={false} onLayout={handleLayout} style={[styles.block, style, { backgroundColor: baseColor }]}>
      {width > 0 && !reduceMotion ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            {
              width: highlightWidth,
              backgroundColor: highlightColor,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: "hidden" },
  highlight: { ...StyleSheet.absoluteFillObject, opacity: 0.72 },
});
