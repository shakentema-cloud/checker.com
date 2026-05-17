import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { store } from "@/lib/storage";
import { updateGuest } from "@/hooks/useAuth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Checker.com" }] }),
  component: Settings,
});

function Settings() {
  const [s, setS] = useState<any>({});
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(store.getSettings());
    const raw = localStorage.getItem("checker.guest");
    if (raw) try { const g = JSON.parse(raw); setName(g.display_name ?? ""); setCity(g.city ?? ""); } catch {}
  }, []);

  const save = () => {
    store.setSettings(s);
    updateGuest({ display_name: name, city });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (!confirm("Erase all local data — games, coach sessions, puzzle progress?")) return;
    ["checker.games", "checker.coach", "checker.puzzles", "checker.rush", "checker.settings", "checker.clubs", "checker.guest"].forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Configuration</div>
        <h1 className="font-display text-4xl text-ink mb-8">Settings</h1>

        <div className="space-y-6">
          <Section title="Profile">
            <Field label="Display name"><input value={name} onChange={e => setName(e.target.value)} className="input" /></Field>
            <Field label="City"><input value={city} onChange={e => setCity(e.target.value)} className="input" /></Field>
          </Section>
          <Section title="Board">
            <Field label="Board theme">
              <select value={s.boardTheme} onChange={e => setS({...s, boardTheme: e.target.value})} className="input">
                <option value="archive">Archive (Forest)</option>
                <option value="parchment">Parchment</option>
                <option value="ebony">Ebony</option>
              </select>
            </Field>
            <Field label="Piece style">
              <select value={s.pieceStyle} onChange={e => setS({...s, pieceStyle: e.target.value})} className="input">
                <option value="forest-oxblood">Forest &amp; Oxblood</option>
                <option value="ivory-ebony">Ivory &amp; Ebony</option>
                <option value="gold-ebony">Antique Gold &amp; Ebony</option>
              </select>
            </Field>
            <Toggle label="Show coordinates" value={s.showCoords} onChange={v => setS({...s, showCoords: v})} />
            <Toggle label="Show legal moves" value={s.showLegal} onChange={v => setS({...s, showLegal: v})} />
            <Toggle label="Auto-flip board" value={s.autoFlip} onChange={v => setS({...s, autoFlip: v})} />
          </Section>
          <Section title="Sound &amp; motion">
            <Toggle label="Sound effects" value={s.sound} onChange={v => setS({...s, sound: v})} />
            <Toggle label="Animations" value={s.animations} onChange={v => setS({...s, animations: v})} />
          </Section>
          <Section title="Data">
            <button onClick={() => { const all = { games: store.getGames(), coach: store.getCoach(), puzzles: store.getPuzzles() }; const blob = new Blob([JSON.stringify(all, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "checker-export.json"; a.click(); }} className="px-4 py-2 border border-forest text-forest text-xs uppercase tracking-wider font-sans hover:bg-forest hover:text-primary-foreground">Export Data</button>
            <button onClick={reset} className="ml-2 px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-wider font-sans hover:bg-oxblood hover:text-destructive-foreground">Reset Local Data</button>
          </Section>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button onClick={save} className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">Save Settings</button>
          {saved && <span className="font-sans text-xs text-gold uppercase tracking-wider">Saved</span>}
        </div>
      </div>

      <style>{`.input { width: 100%; background: var(--paper); border: 1px solid var(--border); padding: 0.5rem 0.75rem; font-family: var(--font-mono); font-size: 0.875rem; }`}</style>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dossier">
      <div className="dossier-header">{title}</div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-[10px] uppercase tracking-wider text-ink-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-serif text-sm text-ink">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-10 h-5 relative rounded-full transition ${value ? "bg-forest" : "bg-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-card rounded-full transition ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
