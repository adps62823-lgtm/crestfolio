import { listAssets } from "@/server/repository";
import { MultiChartMatrix } from "@/components/multi-chart-matrix";

export const dynamic = "force-dynamic";

export default async function MatrixPage() {
  const assets = await listAssets({ assetClass: "all" });

  return (
    <main className="fade-up">
      <MultiChartMatrix allAssets={assets} />
    </main>
  );
}
