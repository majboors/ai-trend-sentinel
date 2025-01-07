import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Asset {
  symbol: string;
  free: number;
  locked: number;
  account_type: string;
}

interface AssetsTableProps {
  assets: Asset[];
  isLoading: boolean;
}

export const AssetsTable = ({ assets, isLoading }: AssetsTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!assets.length) {
    return <p className="text-muted-foreground">No assets found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead className="text-right">Locked</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={`${asset.symbol}-${asset.account_type}`}>
            <TableCell className="font-medium">{asset.symbol}</TableCell>
            <TableCell className="text-right">{asset.free.toFixed(8)}</TableCell>
            <TableCell className="text-right">{asset.locked.toFixed(8)}</TableCell>
            <TableCell className="text-right">
              {(asset.free + asset.locked).toFixed(8)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};