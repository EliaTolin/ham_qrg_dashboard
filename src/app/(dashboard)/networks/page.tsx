import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function NetworksPage() {
  const supabase = await createClient();
  const { data: networks } = await supabase
    .from("networks")
    .select("*, parent:networks!networks_parent_network_id_fkey(name)")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Parent Network</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {networks?.map((network) => (
              <TableRow key={network.id}>
                <TableCell className="font-medium">{network.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{network.kind}</Badge>
                </TableCell>
                <TableCell>
                  {(network.parent as unknown as { name: string } | null)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  {network.website ? (
                    <a
                      href={network.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {new URL(network.website).hostname}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {network.notes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {(!networks || networks.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No networks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
