import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

const whalesData = [
  {
    id: 1,
    wallet: "0x1234...5678",
    amount: 500000,
    type: "buy",
    time: "2h ago",
  },
  {
    id: 2,
    wallet: "0x8765...4321",
    amount: -300000,
    type: "sell",
    time: "4h ago",
  },
  {
    id: 3,
    wallet: "0x9876...1234",
    amount: 250000,
    type: "buy",
    time: "6h ago",
  },
];

export function WhalesActivity() {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Whales Activity</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wallet</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {whalesData.map((whale) => (
            <TableRow key={whale.id}>
              <TableCell className="font-mono">{whale.wallet}</TableCell>
              <TableCell className={`flex items-center gap-1 ${whale.amount > 0 ? 'profit' : 'loss'}`}>
                {whale.amount > 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                ${Math.abs(whale.amount).toLocaleString()}
              </TableCell>
              <TableCell>{whale.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}