"use client";

import { Button } from "@/components/ui/button";

export default function RepeatersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground">
        {error.message || "Failed to load repeaters."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
