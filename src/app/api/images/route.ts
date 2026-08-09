import { NextResponse } from "next/server";
import { uploadImageToImgBB } from "@/lib/imgbb";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!token || !apiKey) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const verification = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
      },
    );
    if (!verification.ok) {
      return NextResponse.json({ error: "Session Firebase invalide." }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image manquante." }, { status: 400 });
    }

    const url = await uploadImageToImgBB(file);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload impossible." },
      { status: 500 },
    );
  }
}
