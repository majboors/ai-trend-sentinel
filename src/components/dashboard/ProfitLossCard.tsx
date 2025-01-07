import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfitLossCardProps {
  value: number;
  percentage: number;
  title: string;
}

export function ProfitLossCard({ value, percentage, title }: ProfitLossCardProps) {
  const isProfit = value >= 0;
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(value));

  return (
    <Card className={cn(
      "glass-card p-4 md:p-6 animate-fade-in transition-all duration-300",
      isProfit ? "hover:shadow-green-500/10" : "hover:shadow-red-500/10"
    )}>
      <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-1 md:gap-2">
        <span className={cn(
          "text-lg md:text-2xl font-bold truncate",
          isProfit ? "text-green-500" : "text-red-500"
        )}>
          {isProfit ? '+' : '-'}{formattedValue}
        </span>
        <span className={cn(
          "flex items-center text-xs md:text-sm whitespace-nowrap",
          isProfit ? "text-green-500" : "text-red-500"
        )}>
          {isProfit ? 
            <ArrowUpIcon className="h-3 w-3 md:h-4 md:w-4" /> : 
            <ArrowDownIcon className="h-3 w-3 md:h-4 md:w-4" />
          }
          {Math.abs(percentage).toFixed(2)}%
        </span>
      </div>
    </Card>
  );
}