import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";

export async function GET(request) {
  try {
    requireAdmin(request);
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
