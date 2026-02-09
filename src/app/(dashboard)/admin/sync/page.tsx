import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default async function SyncPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync Runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Sync management coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
