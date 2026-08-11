import { ResearchNotesPanel } from "@/components/research-notes-panel";
import { getResearchNotes } from "@/server/repository";

export default async function ResearchPage() {
  const notes = await getResearchNotes();

  return (
    <main className="fade-up stack">
      <section className="panel">
        <h3>Research Memory</h3>
        <p className="muted">
          This is the part that turns Crestfolio into a real workflow tool instead of a transient dashboard.
        </p>
      </section>

      <ResearchNotesPanel notes={notes} />
    </main>
  );
}
