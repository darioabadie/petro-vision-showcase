import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { glossary } from "@/lib/mock-data";
import { useState } from "react";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/wiki")({
  head: () => ({
    meta: [
      { title: "Wiki & Glosario · PetroData" },
      { name: "description", content: "Glosario técnico, regulatorio y comercial del oil & gas argentino, en español." },
    ],
  }),
  component: Page,
});

function Page() {
  const [q, setQ] = useState("");
  const filtered = glossary.filter(
    (g) => g.term.toLowerCase().includes(q.toLowerCase()) || g.def.toLowerCase().includes(q.toLowerCase())
  );
  const cats = Array.from(new Set(glossary.map((g) => g.cat)));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Base de conocimiento"
        title="Wiki & Glosario"
        description="Términos técnicos, regulatorios y comerciales del sector, en español argentino. Cada entrada linkea a las entidades donde aparece."
      />
      <div className="p-6 space-y-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar término…"
          className="w-full max-w-md h-10 rounded-md border border-input bg-input/50 px-3 text-sm outline-none focus:border-primary/60"
        />

        {cats.map((cat) => {
          const items = filtered.filter((g) => g.cat === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-primary font-medium">{cat}</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {items.map((g) => (
                  <div key={g.term} className="panel p-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <h3 className="font-display font-semibold">{g.term}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{g.def}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
