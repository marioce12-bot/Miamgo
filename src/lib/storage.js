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

export async function uploadImageFile(file, options = {}) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) throw new Error("invalid-image");
  if (file.size > 10 * 1024 * 1024) throw new Error("image-too-large");
  const optimized = await compressImage(file, options.maxWidth || 1600, options.quality || 0.8);
  const data = new FormData();
  data.append("image", optimized);
  const response = await fetch("/api/upload-image", { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "upload-failed");
  return result.url;
}
