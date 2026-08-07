import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "La variable IMGBB_API_KEY est absente côté serveur." }, { status: 500 });
  const input = await request.formData();
  const image = input.get("image");
  if (!image || typeof image === "string" || !image.type?.startsWith("image/")) return NextResponse.json({ error: "Fichier image invalide." }, { status: 400 });
  if (image.size > 10 * 1024 * 1024) return NextResponse.json({ error: "L'image ne doit pas dépasser 10 Mo." }, { status: 400 });
  const bytes = Buffer.from(await image.arrayBuffer());
  const body = new FormData();
  body.append("image", bytes.toString("base64"));
  body.append("name", image.name.replace(/\.[^.]+$/, "").slice(0, 80));
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, { method: "POST", body });
  const payload = await response.json();
  if (!response.ok || !payload.success) return NextResponse.json({ error: payload?.error?.message || "ImgBB a refusé le téléversement." }, { status: 502 });
  return NextResponse.json({ url: payload.data.url });
}
