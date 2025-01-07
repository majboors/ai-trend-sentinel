import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Asset {
  id: string;
  user_id: string;
  symbol: string;
  free: number;
  locked: number;
  account_type: "spot" | "margin";
  last_updated: string;
  created_at: string;
}

interface AssetsTableProps {
  assets: Asset[];
  isLoading: boolean;
}

export const AssetsTable = ({ assets, isLoading }: AssetsTableProps) => {
  if (isLoading) {
    return <div>Loading assets...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Free</TableHead>
            <TableHead className="text-right">Locked</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.symbol}</TableCell>
              <TableCell>
                <Badge variant={asset.account_type === "spot" ? "default" : "secondary"}>
                  {asset.account_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{asset.free.toFixed(8)}</TableCell>
              <TableCell className="text-right">{asset.locked.toFixed(8)}</TableCell>
              <TableCell className="text-right">
                {(asset.free + asset.locked).toFixed(8)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};