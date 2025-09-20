// app/components/CollapsibleText.tsx
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  text: string;
  numberOfLines?: number; // collapsed lines
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  readMoreText?: string;
  showLessText?: string;
  threshold?: number; // chars threshold to show toggle
};

const CollapsibleText: React.FC<Props> = ({
  text,
  numberOfLines = 6,
  containerStyle,
  textStyle,
  readMoreText = 'Read more',
  showLessText = 'Show less',
  threshold = 220,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((s) => !s);
  };

  // default app typography — tune to match your app
  const defaultTextStyle: TextStyle = {
    fontSize: 16,
    lineHeight: 24,
    color: '#222222',
    // fontFamily: 'System', // uncomment / change if you use custom font
  };

  const shouldShowToggle = typeof text === 'string' && text.length > threshold;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text numberOfLines={expanded ? undefined : numberOfLines} style={[defaultTextStyle, textStyle]}>
        {text}
      </Text>

      {shouldShowToggle ? (
        <TouchableOpacity onPress={toggle} style={styles.toggle}>
          <Text style={styles.toggleText}>{expanded ? showLessText : readMoreText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default CollapsibleText;

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  toggle: { marginTop: 8 },
  toggleText: { color: '#007AFF', fontWeight: '700' },
});
