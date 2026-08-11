import { NextResponse } from "next/server";
import { getAssetDetail } from "@/server/repository";
import { buildAssetCsv, buildAssetMarkdown, buildAssetPdfBuffer } from "@/server/export";

export const runtime = "nodejs";

function deriveInsight(detail: NonNullable<Awaited<ReturnType<typeof getAssetDetail>>>) {
  const asset = detail.asset;
  const event = detail.events[0]?.title ?? "no fresh event";
  return [
    `${asset.name} is currently sitting at ${asset.lastPrice.toLocaleString("en-IN")} with conviction ${asset.convictionScore} and risk ${asset.riskScore}.`,
    `Recent events suggest ${event}.`,
    `Use ${asset.benchmark} as the reference benchmark before taking action.`,
  ].join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "md";
  const detail = await getAssetDetail(slug);

  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const insight = deriveInsight(detail);

  if (format === "csv") {
    return new NextResponse(buildAssetCsv(detail), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await buildAssetPdfBuffer(detail, insight);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      },
    });
  }

  return new NextResponse(buildAssetMarkdown(detail, insight), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.md"`,
    },
  });
}
