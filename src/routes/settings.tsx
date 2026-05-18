import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { updateGuest, useAuth } from "@/hooks/useAuth";
import { store, userStore } from "@/lib/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Checker.com" }] }),
  component: Settings,
});

function getInitials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "C";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function Settings() {
  const { localUser, refreshLocalUser } = useAuth();
  const [s, setS] = useState<any>({});
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("KZ");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setS(store.getSettings());
    const profile = userStore.get();
    setName(profile?.display_name ?? "");
    setCity(profile?.city ?? "Almaty");
    setCountry(profile?.country ?? "KZ");
    setAvatar(profile?.avatar);
  }, []);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    store.setSettings(s);
    updateGuest({
      display_name: name.trim() || localUser?.display_name || "Guest",
      city: city.trim() || "Almaty",
      country: country.trim() || "KZ",
      avatar,
    });
    refreshLocalUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (!confirm("Erase all local data — profile, games, coach sessions, puzzle progress, and settings?")) return;
    [
      "checker.user",
      "checker.games",
      "checker.coach",
      "checker.puzzles",
      "checker.rush",
      "checker.settings",
      "checker.clubs",
      "checker.lessons",
      "checker.training",
    ].forEach((key) => localStorage.removeItem(key));
    location.reload();
  };

  const previewName = name.trim() || localUser?.display_name || "Checker Player";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-2">Configuration</div>
        <h1 className="font-display text-4xl text-ink mb-3">Settings</h1>
        <p className="font-serif text-ink-muted mb-8 max-w-2xl">
          Adjust your public profile, upload your avatar, tune the board, and manage the local archive saved on this device.
        </p>

        <div className="space-y-6">
          <Section title="Profile">
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
              <div className="rounded-[1.5rem] border border-border bg-card/70 p-5">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 border border-gold/20 shadow-lg">
                    {avatar && <AvatarImage src={avatar} alt={previewName} />}
                    <AvatarFallback className="bg-forest text-parchment font-display text-3xl">
                      {getInitials(previewName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 font-display text-2xl text-ink">{previewName}</div>
                  <div className="mt-1 font-sans text-[10px] uppercase tracking-[0.22em] text-gold">
                    {localUser?.email || "Local player profile"}
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-border text-ink-muted text-[11px] uppercase tracking-[0.18em] font-sans hover:border-gold/50 hover:text-forest transition"
                    >
                      Upload avatar
                    </button>
                    {avatar && (
                      <button
                        onClick={() => setAvatar(undefined)}
                        className="px-4 py-2 border border-border text-ink-muted text-[11px] uppercase tracking-[0.18em] font-sans hover:border-oxblood/50 hover:text-oxblood transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Field label="Display name">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="City">
                    <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
                  </Field>
                  <Field label="Country">
                    <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} className="input" />
                  </Field>
                </div>
                <Field label="Email">
                  <input value={localUser?.email ?? ""} className="input opacity-75" readOnly />
                </Field>
                <p className="font-serif text-sm text-ink-muted">
                  Your avatar button in the top-right header now opens your profile, settings, and help from one place on laptop and phone.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Board">
            <Field label="Board theme">
              <select value={s.boardTheme} onChange={(e) => setS({ ...s, boardTheme: e.target.value })} className="input">
                <option value="archive">Archive (Forest)</option>
                <option value="parchment">Parchment</option>
                <option value="ebony">Ebony</option>
              </select>
            </Field>
            <Field label="Piece style">
              <select value={s.pieceStyle} onChange={(e) => setS({ ...s, pieceStyle: e.target.value })} className="input">
                <option value="forest-oxblood">Forest &amp; Oxblood</option>
                <option value="ivory-ebony">Ivory &amp; Ebony</option>
                <option value="gold-ebony">Antique Gold &amp; Ebony</option>
              </select>
            </Field>
            <Toggle label="Show coordinates" value={s.showCoords} onChange={(value) => setS({ ...s, showCoords: value })} />
            <Toggle label="Show legal moves" value={s.showLegal} onChange={(value) => setS({ ...s, showLegal: value })} />
            <Toggle label="Auto-flip board" value={s.autoFlip} onChange={(value) => setS({ ...s, autoFlip: value })} />
          </Section>

          <Section title="Sound & motion">
            <Toggle label="Sound effects" value={s.sound} onChange={(value) => setS({ ...s, sound: value })} />
            <Toggle label="Animations" value={s.animations} onChange={(value) => setS({ ...s, animations: value })} />
          </Section>

          <Section title="Data">
            <p className="font-serif text-sm text-ink-muted">
              Export the archive if you want a backup of your games, coach sessions, puzzle progress, and preferences on this device.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([store.exportAll()], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "checker-export.json";
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 border border-forest text-forest text-xs uppercase tracking-wider font-sans hover:bg-forest hover:text-primary-foreground"
              >
                Export Data
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 border border-oxblood text-oxblood text-xs uppercase tracking-wider font-sans hover:bg-oxblood hover:text-destructive-foreground"
              >
                Reset Local Data
              </button>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button onClick={save} className="px-6 py-2 bg-forest text-primary-foreground text-xs uppercase tracking-[0.18em] font-sans hover:bg-forest-deep">
            Save Settings
          </button>
          {saved && <span className="font-sans text-xs text-gold uppercase tracking-wider">Saved</span>}
        </div>
      </div>

      <style>{`.input { width: 100%; background: var(--paper); border: 1px solid var(--border); padding: 0.65rem 0.85rem; font-family: var(--font-mono); font-size: 0.875rem; }`}</style>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dossier">
      <div className="dossier-header">{title}</div>
      <div className="p-5 space-y-4">{children}</div>
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="font-serif text-sm text-ink">{label}</span>
      <button onClick={() => onChange(!value)} className={`w-10 h-5 relative rounded-full transition ${value ? "bg-forest" : "bg-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-card rounded-full transition ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
