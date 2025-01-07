import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProfitLossCardProps {
  value: number;
  percentage: number;
  title: string;
}

export function ProfitLossCard({ value, percentage, title }: ProfitLossCardProps) {
  const isProfit = value >= 0;
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(value));

  return (
    <Card className="glass-card p-6 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? '+' : '-'}{formattedValue}
        </span>
        <span className={`flex items-center text-sm ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          {Math.abs(percentage)}%
        </span>
      </div>
    </Card>
  );
}