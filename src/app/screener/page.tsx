import { ScreenerStudio } from "@/components/screener-studio";
import { listScreenerPresets, getUniverseFacets } from "@/server/repository";

export default async function ScreenerPage() {
  const [presets, facets] = await Promise.all([listScreenerPresets(), getUniverseFacets()]);

  return (
    <main className="fade-up">
      <ScreenerStudio presets={presets} facets={facets} />
    </main>
  );
}
