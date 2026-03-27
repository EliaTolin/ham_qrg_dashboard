"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { sendBroadcastNotification } from "@/app/actions/notifications";

const LANGUAGES = [
  { code: "it", label: "Italiano", flag: "IT", required: true },
  { code: "en", label: "English", flag: "EN", required: false },
  { code: "de", label: "Deutsch", flag: "DE", required: false },
  { code: "fr", label: "Français", flag: "FR", required: false },
  { code: "es", label: "Español", flag: "ES", required: false },
  { code: "pt", label: "Português", flag: "PT", required: false },
  { code: "ja", label: "日本語", flag: "JA", required: false },
  { code: "zh", label: "中文", flag: "ZH", required: false },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

export function SendNotificationForm() {
  const router = useRouter();
  const [titles, setTitles] = useState<Record<string, string>>({ it: "" });
  const [bodies, setBodies] = useState<Record<string, string>>({ it: "" });
  const [enabledLangs, setEnabledLangs] = useState<Set<LangCode>>(
    new Set(["it"])
  );
  const [sending, setSending] = useState(false);

  function toggleLang(code: LangCode) {
    setEnabledLangs((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
        // Clean up text
        setTitles((t) => {
          const copy = { ...t };
          delete copy[code];
          return copy;
        });
        setBodies((b) => {
          const copy = { ...b };
          delete copy[code];
          return copy;
        });
      } else {
        next.add(code);
      }
      return next;
    });
  }

  function updateTitle(code: string, value: string) {
    setTitles((prev) => ({ ...prev, [code]: value }));
  }

  function updateBody(code: string, value: string) {
    setBodies((prev) => ({ ...prev, [code]: value }));
  }

  async function handleSend() {
    setSending(true);
    const result = await sendBroadcastNotification(titles, bodies);
    setSending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Notifica inviata a tutti gli utenti");
      setTitles({ it: "" });
      setBodies({ it: "" });
      setEnabledLangs(new Set(["it"]));
      router.refresh();
    }
  }

  const canSend =
    (titles.it?.trim().length ?? 0) > 0 &&
    (bodies.it?.trim().length ?? 0) > 0;

  const optionalLangs = LANGUAGES.filter((l) => !l.required);
  const activeLangs = LANGUAGES.filter((l) => enabledLangs.has(l.code));

  // Build preview entries
  const previewEntries = activeLangs
    .filter((l) => titles[l.code]?.trim() || bodies[l.code]?.trim())
    .map((l) => ({
      flag: l.flag,
      title: titles[l.code]?.trim() || "",
      body: bodies[l.code]?.trim() || "",
    }));

  return (
    <div className="space-y-6">
      {/* Language selector */}
      <div className="space-y-2">
        <Label>Lingue aggiuntive</Label>
        <div className="flex flex-wrap gap-2">
          {optionalLangs.map((lang) => {
            const active = enabledLangs.has(lang.code);
            return (
              <Badge
                key={lang.code}
                variant={active ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleLang(lang.code)}
              >
                {lang.flag} {lang.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Language fields */}
      <div className="space-y-4">
        {activeLangs.map((lang) => (
          <Card key={lang.code}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {lang.flag} {lang.label}
                  {lang.required && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (obbligatorio)
                    </span>
                  )}
                </CardTitle>
                {!lang.required && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleLang(lang.code)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor={`notif-title-${lang.code}`}>
                  {lang.code === "it" ? "Titolo" : "Title"}
                </Label>
                <Input
                  id={`notif-title-${lang.code}`}
                  value={titles[lang.code] ?? ""}
                  onChange={(e) => updateTitle(lang.code, e.target.value)}
                  placeholder={
                    lang.code === "it"
                      ? "es. Manutenzione programmata"
                      : "e.g. Scheduled maintenance"
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`notif-body-${lang.code}`}>
                  {lang.code === "it" ? "Messaggio" : "Message"}
                </Label>
                <Textarea
                  id={`notif-body-${lang.code}`}
                  value={bodies[lang.code] ?? ""}
                  onChange={(e) => updateBody(lang.code, e.target.value)}
                  placeholder={
                    lang.code === "it"
                      ? "Scrivi il corpo della notifica..."
                      : "Write the notification body..."
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {enabledLangs.size === 1 && (
        <p className="text-xs text-muted-foreground">
          Il testo italiano verrà usato come fallback per le lingue non
          configurate.
        </p>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={!canSend || sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Invio in corso..." : "Invia a tutti gli utenti"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma invio notifica</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per inviare una notifica push a tutti gli utenti registrati.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-3 max-h-60 overflow-y-auto">
            {previewEntries.map((entry) => (
              <div key={entry.flag}>
                <p className="text-xs font-medium text-muted-foreground">
                  {entry.flag}
                </p>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-muted-foreground">{entry.body}</p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={sending}>
              {sending ? "Invio..." : "Conferma invio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
