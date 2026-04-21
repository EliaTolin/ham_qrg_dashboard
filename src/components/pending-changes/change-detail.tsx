"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import type {
  PendingChangeStatus,
  PendingChangeType,
  SyncPendingChange,
} from "@/lib/types";

// --- Constants ---

export const CHANGE_TYPE_VARIANT: Record<
  PendingChangeType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  update: "secondary",
  deactivate: "destructive",
  reactivate: "outline",
};

export const CHANGE_TYPE_LABEL: Record<PendingChangeType, string> = {
  new: "Nuovo",
  update: "Aggiornamento",
  deactivate: "Disattivazione",
  reactivate: "Riattivazione",
};

export const STATUS_VARIANT: Record<
  PendingChangeStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export const STATUS_LABEL: Record<PendingChangeStatus, string> = {
  pending: "In attesa",
  approved: "Approvato",
  rejected: "Rifiutato",
};

export const WINNER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  remote: "default",
  local: "secondary",
  unknown: "outline",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  callsign: "Nominativo",
  frequency_hz: "Frequenza",
  shift_hz: "Shift",
  locality: "Località",
  locator: "Locator",
  lat: "Latitudine",
  lon: "Longitudine",
  is_active: "Attivo",
  AutoON: "AutoON",
  ManualON: "ManualON",
  scope: "Ambito",
  "access.mode": "Modo accesso",
  "access.ctcss_tx_hz": "CTCSS TX",
  "access.color_code": "Color Code",
  "access.node_id": "Node ID",
};

// --- Types ---

export interface RepeaterSummary {
  id: string;
  name: string | null;
  callsign: string | null;
  frequency_hz: number;
  shift_hz: number | null;
  locality: string | null;
  locator: string | null;
  is_active: boolean;
  repeater_access: {
    mode: string;
    ctcss_tx_hz: number | null;
    color_code: number | null;
    node_id: number | null;
    network: { name: string } | null;
  }[];
}

// --- Helpers ---

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function fmtFreq(hz: number): string {
  return (hz / 1_000_000).toFixed(4) + " MHz";
}

export function fmtShift(hz: number): string {
  return (hz > 0 ? "+" : "") + (hz / 1_000_000).toFixed(1) + " MHz";
}

export function fmtVal(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "frequency_hz" || field === "shift_hz")
    return fmtFreq(value as number);
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") return value.toString();
  return String(value);
}

// --- Sub-components ---

function DiffRow({
  label,
  before,
  after,
  changed,
}: {
  label: string;
  before: string;
  after: string;
  changed: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[140px_1fr_1fr] gap-2 px-3 py-1.5 rounded text-sm ${
        changed ? "bg-amber-500/10" : ""
      }`}
    >
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={changed ? "line-through text-muted-foreground" : ""}>
        {before}
      </span>
      <span className={changed ? "font-semibold text-foreground" : ""}>
        {after}
      </span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3 first:mt-0">
      {children}
    </div>
  );
}

function AccessBadge({
  access,
}: {
  access: RepeaterSummary["repeater_access"][0];
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
      <span className="font-semibold">{access.mode}</span>
      {access.network?.name && (
        <span className="text-muted-foreground">{access.network.name}</span>
      )}
      {access.ctcss_tx_hz != null && (
        <span className="text-muted-foreground">
          CTCSS {access.ctcss_tx_hz}
        </span>
      )}
      {access.color_code != null && (
        <span className="text-muted-foreground">CC{access.color_code}</span>
      )}
      {access.node_id != null && (
        <span className="text-muted-foreground">#{access.node_id}</span>
      )}
    </span>
  );
}

/** Collapsible raw JSON data section (defaults to open=false) */
export function RawDataSection({
  data,
  defaultOpen = false,
  label = "Dato raw iz8wnh",
}: {
  data: Record<string, unknown>;
  defaultOpen?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && (
        <pre className="mt-1 max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** Compact card showing our local repeater state */
export function LocalRepeaterCard({ repeater }: { repeater: RepeaterSummary }) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {repeater.callsign ?? "—"}
        </span>
        {repeater.name && (
          <span className="text-muted-foreground">— {repeater.name}</span>
        )}
        {!repeater.is_active && (
          <Badge variant="destructive" className="text-xs">
            INATTIVO
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground font-mono">
        <span>
          {fmtFreq(repeater.frequency_hz)}
          {repeater.shift_hz != null && (
            <span className="ml-1">({fmtShift(repeater.shift_hz)})</span>
          )}
        </span>
        {repeater.locality && <span>{repeater.locality}</span>}
        {repeater.locator && <span>{repeater.locator}</span>}
      </div>
      {repeater.repeater_access.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {repeater.repeater_access.map((a, i) => (
            <AccessBadge key={i} access={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Full expanded detail for a pending change */
export function ChangeDetail({
  change,
  localRepeater,
  showLocalContext = true,
}: {
  change: SyncPendingChange;
  localRepeater?: RepeaterSummary;
  showLocalContext?: boolean;
}) {
  const rd = change.remote_data as Record<
    string,
    string | number | boolean | null | undefined
  >;
  const diff = change.diff;
  const diffKeys = Object.keys(diff).filter((k) => k !== "scope");

  // --- NEW REPEATER ---
  if (change.change_type === "new") {
    return (
      <div className="space-y-1">
        <SectionHeader>Nuovo ripetitore da iz8wnh</SectionHeader>
        <div className="rounded-md border bg-green-500/5 p-3 space-y-1 text-sm font-mono">
          {[
            ["Nominativo", rd.Identificativo],
            ["Nome", rd.Ripetitore],
            ["Frequenza", rd.Frequenza ? `${rd.Frequenza} MHz` : null],
            ["Shift", rd.Shift ? `${rd.Shift} MHz` : null],
            ["Tipologia", rd.Tipologia],
            ["Tono CTCSS", rd.Tono && rd.Tono !== "0" ? rd.Tono : null],
            ["Color Code", rd.ColorCode],
            ["Node/Stanza", rd.Stanza],
            ["Rete", rd.Rete],
            ["Località", rd.Localita],
            ["Locator", rd.Locator],
            ["Coordinate", rd.Lat && rd.Long ? `${rd.Lat}, ${rd.Long}` : null],
            ["Ultima modifica", rd.Ultima_Modifica],
          ].map(([label, value]) =>
            value ? (
              <div
                key={label as string}
                className="grid grid-cols-[140px_1fr] gap-2 px-3 py-0.5"
              >
                <span className="text-muted-foreground">{label as string}</span>
                <span className="text-green-700 dark:text-green-400">
                  {String(value)}
                </span>
              </div>
            ) : null
          )}
        </div>
        <RawDataSection data={rd} />
      </div>
    );
  }

  // --- DEACTIVATE / REACTIVATE ---
  if (
    change.change_type === "deactivate" ||
    change.change_type === "reactivate"
  ) {
    const isDeactivate = change.change_type === "deactivate";
    const scope = diff.scope?.remote as string | undefined;
    const tipologia = rd.Tipologia as string | undefined;
    const isAccessLevel = scope === "access";

    return (
      <div className="space-y-2">
        {showLocalContext && localRepeater && (
          <>
            <SectionHeader>Stato attuale nel nostro DB</SectionHeader>
            <LocalRepeaterCard repeater={localRepeater} />
          </>
        )}

        <SectionHeader>Modifica proposta</SectionHeader>
        <div
          className={`rounded-md border p-3 text-sm ${
            isDeactivate
              ? "bg-red-500/5 border-red-500/20"
              : "bg-green-500/5 border-green-500/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="h-4 w-4" />
            <span className="font-semibold">
              {isDeactivate
                ? isAccessLevel
                  ? `Disattivare accesso ${tipologia ?? "?"}`
                  : "Disattivare ripetitore"
                : "Riattivare ripetitore"}
            </span>
          </div>
          <div className="space-y-1 text-muted-foreground font-mono text-xs">
            {tipologia && (
              <div>
                Tipologia: <span className="text-foreground">{tipologia}</span>
              </div>
            )}
            {rd.Frequenza != null && (
              <div>
                Frequenza:{" "}
                <span className="text-foreground">
                  {String(rd.Frequenza)} MHz
                </span>
              </div>
            )}
            {diff.AutoON && (
              <div>
                AutoON:{" "}
                <span className="text-foreground">
                  {String(diff.AutoON.remote)}
                </span>
              </div>
            )}
            {diff.ManualON && (
              <div>
                ManualON:{" "}
                <span className="text-foreground">
                  {String(diff.ManualON.remote)}
                </span>
              </div>
            )}
          </div>
          {isAccessLevel && (
            <p className="mt-2 text-xs text-muted-foreground">
              Solo questo accesso verrà rimosso. Se non restano altri accessi,
              il ripetitore verrà nascosto.
            </p>
          )}
        </div>
        <RawDataSection data={rd} />
      </div>
    );
  }

  // --- UPDATE ---
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Campo</span>
        <span>Stato attuale (DB)</span>
        <span>Proposta iz8wnh</span>
      </div>

      <div className="rounded-md border divide-y">
        {diffKeys.map((field) => {
          const d = diff[field] as { local: unknown; remote: unknown };
          return (
            <DiffRow
              key={field}
              label={fieldLabel(field)}
              before={fmtVal(field, d.local)}
              after={fmtVal(field, d.remote)}
              changed={true}
            />
          );
        })}
      </div>

      {showLocalContext && localRepeater && (
        <>
          <SectionHeader>Contesto ripetitore (invariato)</SectionHeader>
          <LocalRepeaterCard repeater={localRepeater} />
        </>
      )}

      {(rd.Tipologia || rd.Tono || rd.Rete) && (
        <>
          <SectionHeader>Info accesso da iz8wnh</SectionHeader>
          <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs space-y-0.5">
            {rd.Tipologia && <div>Tipologia: {String(rd.Tipologia)}</div>}
            {rd.Tono && rd.Tono !== "0" && (
              <div>Tono CTCSS: {String(rd.Tono)}</div>
            )}
            {rd.ColorCode && <div>Color Code: {String(rd.ColorCode)}</div>}
            {rd.Stanza && <div>Node/Stanza: {String(rd.Stanza)}</div>}
            {rd.Rete && <div>Rete: {String(rd.Rete)}</div>}
          </div>
        </>
      )}

      <RawDataSection data={rd} />

      <div className="flex gap-4 text-xs text-muted-foreground pt-1">
        {change.remote_updated_at && (
          <span>
            Aggiornato da iz8wnh:{" "}
            {new Date(change.remote_updated_at).toLocaleString("it-IT")}
          </span>
        )}
        {change.local_updated_at && (
          <span>
            Aggiornato da noi:{" "}
            {new Date(change.local_updated_at).toLocaleString("it-IT")}
          </span>
        )}
      </div>
    </div>
  );
}
