import { NextResponse } from "next/server";
import { ensureSeeded } from "@/server/repository";

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({
    status: "ok",
    app: "Crestfolio",
    timestamp: new Date().toISOString(),
  });
}
