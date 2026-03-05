import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }
  return NextResponse.json({ isAdmin: true });
}
