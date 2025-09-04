import { Text, View } from "react-native";

export default function RootLayout() {
  console.log("✅ RootLayout mounted");
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Hello Expo</Text>
    </View>
  );
}
