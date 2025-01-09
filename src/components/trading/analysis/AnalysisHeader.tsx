import { ViewTypeSelector } from "../ViewTypeSelector";

interface AnalysisHeaderProps {
  viewType: string;
  onViewTypeChange: (value: string) => void;
  currentIndex: number;
  total: number;
}

export function AnalysisHeader({ 
  viewType, 
  onViewTypeChange,
}: AnalysisHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground/90">Trading Analysis</h2>
        <ViewTypeSelector value={viewType} onValueChange={onViewTypeChange} />
      </div>
    </div>
  );
}