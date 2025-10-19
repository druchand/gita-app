// app/index.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Index(): React.ReactElement {
  return (
    <View style={styles.root}>
      <Text>Home route OK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});