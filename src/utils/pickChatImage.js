import * as ImagePicker from "expo-image-picker";

const MAX_DATA_URL_CHARS = 380000;

/**
 * Bild für Chat-Nachricht als Data-URL (kompatibel zum CardCore-Backend).
 */
export async function pickChatImageDataUrl() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    const err = new Error("PERMISSION_DENIED");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.72,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const b64 = asset.base64;
  if (!b64) {
    const err = new Error("NO_BASE64");
    err.code = "NO_BASE64";
    throw err;
  }

  const mime = asset.mimeType || "image/jpeg";
  const dataUrl = `data:${mime};base64,${b64}`;

  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    const err = new Error("TOO_LARGE");
    err.code = "TOO_LARGE";
    throw err;
  }

  return dataUrl;
}
