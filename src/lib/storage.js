async function compressImage(file, maxWidth = 1600, quality = 0.8) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" }) : file;
}

export async function uploadMediaFile(file) {
  if (!file) return null;
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("invalid-media");
  const optimized = file.type.startsWith("video/") ? file : await compressImage(file);
  const data = new FormData();
  data.append("file", optimized);
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const response = await fetch("/api/upload-media", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "upload-failed");
  return result;
}

export async function uploadImageFile(file, options = {}) { const result = await uploadMediaFile(file, options); return result.url; }
import { auth } from "./firebase";
