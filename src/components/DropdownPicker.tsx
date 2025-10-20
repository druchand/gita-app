import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

interface DropdownPickerProps {
  options: { label: string; value: string }[];
  onChange?: (value: string) => void | Promise<void>;
  selectedValue?: string;
}

export default function DropdownPicker({
  options,
  onChange,
  selectedValue,
}: DropdownPickerProps) {
  const handleSelect = async (value: string) => {
    try {
      // normalize sync or async handlers
      await Promise.resolve(onChange?.(value));
    } catch (err) {
      console.warn("[DropdownPicker] onChange failed:", err);
    }
  };

  const renderItem = ({ item }: { item: { label: string; value: string } }) => (
    <Pressable
      onPress={() => handleSelect(item.value)}
      style={[
        styles.option,
        selectedValue === item.value && styles.selectedOption,
      ]}
    >
      <Text
        style={[
          styles.optionText,
          selectedValue === item.value && styles.selectedText,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={(item) => item.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", padding: 8 },
  option: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  selectedOption: { backgroundColor: "#f2f2f2" },
  optionText: { fontSize: 16 },
  selectedText: { fontWeight: "bold", color: "#000" },
});