import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

type Props = {
  text: string;
  numberOfLines?: number;
};

export default function CollapsibleText({ text, numberOfLines = 12 }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Text style={styles.text} numberOfLines={expanded ? undefined : numberOfLines}>
        {text}
      </Text>
      {text.length > 0 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.more}>{expanded ? "Show less" : "More..."}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, lineHeight: 24, color: "white" },
  more: { fontSize: 14, color: "#FFD700", marginTop: 4 },
});
