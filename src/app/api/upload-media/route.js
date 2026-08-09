import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAdminAuth } from "../../../lib/firebaseAdmin";

export const runtime = "nodejs";

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Authentification requise pour téléverser un média." }, { status: 401 });
  try { await getAdminAuth().verifyIdToken(authorization.slice(7)); } catch { return NextResponse.json({ error: "Session invalide." }, { status: 401 }); }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return NextResponse.json({ error: "Le service de stockage média n'est pas configuré." }, { status: 500 });
  const input = await request.formData(); const file = input.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Fichier média invalide." }, { status: 400 });
  const isVideo = file.type?.startsWith("video/"); const isImage = file.type?.startsWith("image/");
  if (!isImage && !isVideo) return NextResponse.json({ error: "Format média non pris en charge." }, { status: 400 });
  if (file.size > (isVideo ? 50 : 10) * 1024 * 1024) return NextResponse.json({ error: isVideo ? "La vidéo ne doit pas dépasser 50 Mo." : "L'image ne doit pas dépasser 10 Mo." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise((resolve, reject) => { const upload = cloudinary.uploader.upload_stream({ resource_type: isVideo ? "video" : "image", folder: "miamgo", transformation: isImage ? [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }] : undefined }, (error, response) => error ? reject(error) : resolve(response)); upload.end(buffer); });
  if (isVideo && result.duration > 60) { await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" }); return NextResponse.json({ error: "La vidéo ne doit pas dépasser 60 secondes." }, { status: 400 }); }
  return NextResponse.json({ url: result.secure_url, mediaType: isVideo ? "video" : "image", publicId: result.public_id, duration: result.duration || null });
}
