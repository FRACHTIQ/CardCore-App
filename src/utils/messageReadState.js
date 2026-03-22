import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@vurax_message_last_reads";

/** @returns {Promise<Record<string, string>>} convId -> ISO-Zeitpunkt „bis hier gelesen“ */
export async function getMessageReads() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function setMessageRead(convId, isoTimestamp) {
  const id = String(convId);
  const reads = await getMessageReads();
  reads[id] = isoTimestamp;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reads));
}
