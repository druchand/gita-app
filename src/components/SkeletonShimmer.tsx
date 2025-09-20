// components/SkeletonShimmer.tsx
import React from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
};

const SkeletonShimmer: React.FC<Props> = ({
  style,
  height = 16,
  width = '100%',
  borderRadius = 8,
}) => {
  const translateX = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  const translate = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  const containerStyle = [
    styles.container,
    { height, width, borderRadius },
    style,
  ] as any;

  return (
    <View style={containerStyle}>
      <View style={styles.gap}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: translate }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  gap: {
    flex: 1,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    left: -200,
    top: 0,
    bottom: 0,
    width: 200,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

export default SkeletonShimmer;
