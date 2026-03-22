import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "../locales/de.json";
import en from "../locales/en.json";

const STORAGE_KEY = "vurex_lang";

function deviceLanguage() {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === "en" ? "en" : "de";
}

export async function initI18n() {
  let lng = deviceLanguage();
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") {
      lng = stored;
    }
  } catch {
    /* ignore */
  }
  await i18n.use(initReactI18next).init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng,
    fallbackLng: "de",
    compatibilityJSON: "v4",
    interpolation: { escapeValue: false },
  });
}

export async function setAppLanguage(lang) {
  if (lang !== "de" && lang !== "en") {
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export { i18n };
export default i18n;
