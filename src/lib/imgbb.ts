import "server-only";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface ImgBBResponse {
  success: boolean;
  data?: {
    url: string;
  };
  error?: {
    message: string;
  };
}

export async function uploadImageToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("La variable IMGBB_API_KEY est absente.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("L'image dépasse la taille maximale de 10 Mo.");
  }

  const body = new FormData();
  body.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
    { method: "POST", body },
  );
  const result = (await response.json()) as ImgBBResponse;

  if (!response.ok || !result.success || !result.data?.url) {
    throw new Error(result.error?.message ?? "Échec de l'upload vers ImgBB.");
  }

  return result.data.url;
}
