import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RepeaterNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-2xl font-bold">Repeater not found</h2>
      <p className="text-muted-foreground">
        The repeater you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/repeaters">Back to Repeaters</Link>
      </Button>
    </div>
  );
}
