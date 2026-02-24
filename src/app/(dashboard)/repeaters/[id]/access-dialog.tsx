"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createAccess,
  updateAccess,
  type AccessFields,
} from "@/app/actions/repeaters";
import type { RepeaterAccessWithNetwork, Network } from "@/lib/types";

const ACCESS_MODES = [
  "ANALOG", "DMR", "C4FM", "DSTAR", "ECHOLINK",
  "SVX", "APRS", "BEACON", "ATV", "NXDN",
  "ALLSTAR", "WINLINK",
] as const;

function parseNum(val: string): number | null {
  if (!val.trim()) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

interface AccessDialogProps {
  repeaterId: string;
  access?: RepeaterAccessWithNetwork;
  networks: Network[];
  trigger: React.ReactNode;
}

export function AccessDialog({
  repeaterId,
  access,
  networks,
  trigger,
}: AccessDialogProps) {
  const router = useRouter();
  const isEdit = !!access;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<string>(access?.mode ?? "ANALOG");
  const [networkId, setNetworkId] = useState(access?.network_id ?? "none");
  const [colorCode, setColorCode] = useState(access?.color_code?.toString() ?? "");
  const [ctcssRx, setCtcssRx] = useState(access?.ctcss_rx_hz?.toString() ?? "");
  const [ctcssTx, setCtcssTx] = useState(access?.ctcss_tx_hz?.toString() ?? "");
  const [dcsCode, setDcsCode] = useState(access?.dcs_code?.toString() ?? "");
  const [dgId, setDgId] = useState(access?.dg_id?.toString() ?? "");
  const [nodeId, setNodeId] = useState(access?.node_id?.toString() ?? "");
  const [talkgroup, setTalkgroup] = useState(access?.talkgroup?.toString() ?? "");
  const [notes, setNotes] = useState(access?.notes ?? "");

  function resetForm() {
    setMode(access?.mode ?? "ANALOG");
    setNetworkId(access?.network_id ?? "none");
    setColorCode(access?.color_code?.toString() ?? "");
    setCtcssRx(access?.ctcss_rx_hz?.toString() ?? "");
    setCtcssTx(access?.ctcss_tx_hz?.toString() ?? "");
    setDcsCode(access?.dcs_code?.toString() ?? "");
    setDgId(access?.dg_id?.toString() ?? "");
    setNodeId(access?.node_id?.toString() ?? "");
    setTalkgroup(access?.talkgroup?.toString() ?? "");
    setNotes(access?.notes ?? "");
  }

  async function handleSave() {
    const fields: AccessFields = {
      mode,
      network_id: networkId === "none" ? null : networkId,
      color_code: parseNum(colorCode),
      ctcss_rx_hz: parseNum(ctcssRx),
      ctcss_tx_hz: parseNum(ctcssTx),
      dcs_code: parseNum(dcsCode),
      dg_id: parseNum(dgId),
      node_id: parseNum(nodeId),
      talkgroup: parseNum(talkgroup),
      notes: notes.trim() || null,
    };

    setSaving(true);
    const result = isEdit
      ? await updateAccess(access!.id, fields)
      : await createAccess(repeaterId, fields);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEdit ? "Accesso aggiornato" : "Accesso aggiunto");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetForm();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifica accesso" : "Aggiungi accesso"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <Select value={networkId} onValueChange={setNetworkId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuno</SelectItem>
                {networks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>CTCSS TX (Hz)</Label>
            <Input
              type="number"
              step="0.1"
              value={ctcssTx}
              onChange={(e) => setCtcssTx(e.target.value)}
              placeholder="es. 88.5"
            />
          </div>

          <div className="space-y-2">
            <Label>CTCSS RX (Hz)</Label>
            <Input
              type="number"
              step="0.1"
              value={ctcssRx}
              onChange={(e) => setCtcssRx(e.target.value)}
              placeholder="es. 88.5"
            />
          </div>

          <div className="space-y-2">
            <Label>DCS Code</Label>
            <Input
              type="number"
              value={dcsCode}
              onChange={(e) => setDcsCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Color Code</Label>
            <Input
              type="number"
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Talkgroup</Label>
            <Input
              type="number"
              value={talkgroup}
              onChange={(e) => setTalkgroup(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>DG-ID</Label>
            <Input
              type="number"
              value={dgId}
              onChange={(e) => setDgId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Node ID</Label>
            <Input
              type="number"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Note</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : isEdit ? "Salva" : "Aggiungi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
