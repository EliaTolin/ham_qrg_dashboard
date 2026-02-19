import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function MapPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Repeater Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            Map visualization coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
