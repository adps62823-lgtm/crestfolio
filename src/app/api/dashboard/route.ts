import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/server/repository";

export async function GET() {
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
