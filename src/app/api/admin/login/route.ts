import { NextRequest, NextResponse } from "next/server";
import { verifyPin, createAdminCookie } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!verifyPin(pin)) {
      return NextResponse.json({ success: false, error: "PIN errato" }, { status: 401 });
    }

    const cookie = createAdminCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options as any);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Errore server" }, { status: 500 });
  }
}
