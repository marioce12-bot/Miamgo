export async function uploadImageFile(file) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) throw new Error("invalid-image");
  if (file.size > 10 * 1024 * 1024) throw new Error("image-too-large");
  const data = new FormData();
  data.append("image", file);
  const response = await fetch("/api/upload-image", { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "upload-failed");
  return result.url;
}
