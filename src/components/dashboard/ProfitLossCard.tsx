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
    <Card className="glass-card p-4 md:p-6 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-1 md:gap-2">
        <span className={`text-lg md:text-2xl font-bold truncate ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? '+' : '-'}{formattedValue}
        </span>
        <span className={`flex items-center text-xs md:text-sm whitespace-nowrap ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? <ArrowUpIcon className="h-3 w-3 md:h-4 md:w-4" /> : <ArrowDownIcon className="h-3 w-3 md:h-4 md:w-4" />}
          {Math.abs(percentage)}%
        </span>
      </div>
    </Card>
  );
}