import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Theme } from "../theme";

/**
 * Umrandetes Feld mit „schwebendem“ Label (Label liegt auf dem Rahmen).
 */
export function OutlinedInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  rightSlot,
  inputRef,
  labelBackgroundColor = Theme.bg,
  ...rest
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.outline, !editable && styles.outlineDisabled]}>
        <Text
          style={[styles.floatLabel, { backgroundColor: labelBackgroundColor }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View style={styles.row}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Theme.muted}
            secureTextEntry={secureTextEntry}
            editable={editable}
            {...rest}
          />
          {rightSlot ? (
            <View style={styles.right}>{rightSlot}</View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function PasswordToggle({ visible, onToggle, labelShow, labelHide }) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      style={styles.toggleHit}
    >
      <Text style={styles.toggleText}>{visible ? labelHide : labelShow}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  outline: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  outlineDisabled: {
    opacity: 0.6,
  },
  floatLabel: {
    position: "absolute",
    left: 12,
    top: -9,
    zIndex: 2,
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: Theme.sub,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.text,
    paddingVertical: 4,
    paddingRight: 8,
  },
  right: {
    justifyContent: "center",
    paddingLeft: 4,
  },
  toggleHit: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.sub,
    letterSpacing: 0.2,
  },
});
