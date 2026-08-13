import { listAssets } from "@/server/repository";
import { SchemeOverlapView } from "@/components/scheme-overlap-view";

export const dynamic = "force-dynamic";

export default async function OverlapPage() {
  const mfAssets = await listAssets({ assetClass: "mutual_fund" });

  return (
    <main className="fade-up">
      <SchemeOverlapView mfAssets={mfAssets} />
    </main>
  );
}
