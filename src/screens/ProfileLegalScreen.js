import { ScrollView, StyleSheet, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
const VALID_KINDS = ["imprint", "terms", "privacy"];

export default function ProfileLegalScreen({ route }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const kind = route.params?.kind;
  const valid = VALID_KINDS.includes(kind);

  const scrollContent = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 16) + 24,
  };

  const body = valid ? t(`profile.legal.${kind}.body`) : "";
  const paragraphs = valid
    ? body.split(/\n\n/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      {!valid ? (
        <Text style={styles.error}>{t("common.error")}</Text>
      ) : (
        <>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p.trim()}
            </Text>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    color: Theme.text,
    marginBottom: 16,
  },
  error: { color: Theme.error, fontSize: 15 },
});
