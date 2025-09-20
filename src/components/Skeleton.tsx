// app/components/Skeleton.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

type BoxProps = {
  width: number | string;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBox({ width, height, radius = 10, style }: BoxProps) {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const base: ViewStyle = {
    height,
    borderRadius: radius,
    backgroundColor: "#2b3345",
    ...(typeof width === "number" ? { width } : {}),
  };

  // cast to any to satisfy Animated style typing across RN versions
  return <Animated.View style={[base as any, typeof width === "string" ? ({ width } as any) : null, { opacity }, style]} />;
}

export function SkeletonLines({ count = 3, grow = false }: { count?: number; grow?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={14}
          width={grow ? "100%" : `${90 - i * 5}%`}
          radius={6}
          style={{ marginBottom: 8 }}
        />
      ))}
    </>
  );
}
