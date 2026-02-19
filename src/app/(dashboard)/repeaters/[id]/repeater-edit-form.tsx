"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { formatFrequency, formatShift } from "@/lib/format";
import {
  updateRepeater,
  type UpdateRepeaterFields,
} from "@/app/actions/repeaters";
import type { Repeater } from "@/lib/types";

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RepeaterEditFormProps {
  repeater: Repeater;
  canEdit: boolean;
}

export function RepeaterEditForm({ repeater, canEdit }: RepeaterEditFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [callsign, setCallsign] = useState(repeater.callsign ?? "");
  const [name, setName] = useState(repeater.name ?? "");
  const [manager, setManager] = useState(repeater.manager ?? "");
  const [frequencyHz, setFrequencyHz] = useState(
    String(repeater.frequency_hz / 1_000_000)
  );
  const [shiftHz, setShiftHz] = useState(
    repeater.shift_hz != null ? String(repeater.shift_hz / 1_000_000) : ""
  );
  const [locality, setLocality] = useState(repeater.locality ?? "");
  const [region, setRegion] = useState(repeater.region ?? "");
  const [provinceCode, setProvinceCode] = useState(
    repeater.province_code ?? ""
  );
  const [locator, setLocator] = useState(repeater.locator ?? "");

  function resetForm() {
    setCallsign(repeater.callsign ?? "");
    setName(repeater.name ?? "");
    setManager(repeater.manager ?? "");
    setFrequencyHz(String(repeater.frequency_hz / 1_000_000));
    setShiftHz(
      repeater.shift_hz != null ? String(repeater.shift_hz / 1_000_000) : ""
    );
    setLocality(repeater.locality ?? "");
    setRegion(repeater.region ?? "");
    setProvinceCode(repeater.province_code ?? "");
    setLocator(repeater.locator ?? "");
  }

  function handleCancel() {
    resetForm();
    setEditing(false);
  }

  async function handleSave() {
    const freqMhz = parseFloat(frequencyHz);
    if (isNaN(freqMhz) || freqMhz <= 0) {
      toast.error("La frequenza deve essere un numero maggiore di 0");
      return;
    }

    const fields: UpdateRepeaterFields = {
      callsign: callsign.trim() || null,
      name: name.trim() || null,
      manager: manager.trim() || null,
      frequency_hz: Math.round(freqMhz * 1_000_000),
      shift_hz: shiftHz.trim()
        ? Math.round(parseFloat(shiftHz) * 1_000_000)
        : null,
      locality: locality.trim() || null,
      region: region.trim() || null,
      province_code: provinceCode.trim() || null,
      locator: locator.trim() || null,
    };

    setSaving(true);
    const result = await updateRepeater(repeater.id, fields);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Ripetitore aggiornato");
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informazioni ripetitore</CardTitle>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Modifica
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <InfoItem
                label="Callsign"
                value={
                  <span className="font-mono">
                    {repeater.callsign ?? "—"}
                  </span>
                }
              />
              <InfoItem
                label="Frequenza"
                value={formatFrequency(repeater.frequency_hz)}
              />
              <InfoItem label="Shift" value={formatShift(repeater.shift_hz)} />
              <InfoItem label="Località" value={repeater.locality ?? "—"} />
              <InfoItem label="Regione" value={repeater.region ?? "—"} />
              <InfoItem label="Provincia" value={repeater.province_code ?? "—"} />
              <InfoItem
                label="Locator"
                value={
                  <span className="font-mono">
                    {repeater.locator ?? "—"}
                  </span>
                }
              />
              <InfoItem label="Gestore" value={repeater.manager ?? "—"} />
              {repeater.lat != null && repeater.lon != null && (
                <InfoItem
                  label="Coordinate"
                  value={
                    <span className="font-mono text-sm">
                      {repeater.lat.toFixed(5)}, {repeater.lon.toFixed(5)}
                    </span>
                  }
                />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <InfoItem label="Source" value={repeater.source} />
              <InfoItem
                label="External ID"
                value={
                  <span className="font-mono text-sm">
                    {repeater.external_id ?? "—"}
                  </span>
                }
              />
              <InfoItem
                label="Ultimo avvistamento"
                value={
                  repeater.last_seen_at
                    ? formatDate(repeater.last_seen_at)
                    : "—"
                }
              />
              <InfoItem label="Creato" value={formatDate(repeater.created_at)} />
              <InfoItem
                label="Aggiornato"
                value={formatDate(repeater.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Modifica ripetitore</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Annulla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-3.5 w-3.5" />
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="edit-callsign">Callsign</Label>
            <Input
              id="edit-callsign"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-manager">Gestore</Label>
            <Input
              id="edit-manager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-freq">Frequenza (MHz)</Label>
            <Input
              id="edit-freq"
              type="number"
              step="0.0001"
              min="0"
              value={frequencyHz}
              onChange={(e) => setFrequencyHz(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-shift">Shift (MHz)</Label>
            <Input
              id="edit-shift"
              type="number"
              step="0.1"
              value={shiftHz}
              onChange={(e) => setShiftHz(e.target.value)}
              placeholder="es. -0.6"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-locality">Località</Label>
            <Input
              id="edit-locality"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-region">Regione</Label>
            <Input
              id="edit-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-province">Provincia</Label>
            <Input
              id="edit-province"
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              maxLength={2}
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-locator">Locator</Label>
            <Input
              id="edit-locator"
              value={locator}
              onChange={(e) => setLocator(e.target.value)}
              className="font-mono uppercase"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
