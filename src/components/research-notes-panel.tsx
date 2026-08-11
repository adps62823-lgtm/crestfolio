"use client";

import { useState } from "react";
import type { ResearchNote } from "@/lib/types";

type Props = {
  notes: ResearchNote[];
};

export function ResearchNotesPanel({ notes }: Props) {
  const [selected, setSelected] = useState(notes[0]?.id ?? "");

  return (
    <div className="section-grid">
      <div className="panel">
        <h3>Research Memory</h3>
        <p className="muted">A running log of ideas, invalidations, and review status.</p>

        <div className="stack" style={{ marginTop: 16 }}>
          {notes.map((note) => (
            <button
              key={note.id}
              className="asset-card button-ghost"
              style={{ textAlign: "left" }}
              onClick={() => setSelected(note.id)}
            >
              <h4>{note.title}</h4>
              <p>{note.thesis}</p>
              <div style={{ marginTop: 10 }} className="pill-row">
                <span className="pill pill-active">{note.status}</span>
                {note.tags.slice(0, 2).map((tag) => (
                  <span className="pill" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {notes.filter((note) => note.id === selected).map((note) => (
          <div key={note.id}>
            <h3>{note.title}</h3>
            <p className="muted">
              Status: <strong>{note.status}</strong> · Updated{" "}
              {new Date(note.updatedAt).toLocaleDateString("en-IN")}
            </p>
            <div style={{ marginTop: 16 }} className="footer-note">
              {note.body}
            </div>
            <div style={{ marginTop: 16 }} className="pill-row">
              {note.tags.map((tag) => (
                <span className="pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
