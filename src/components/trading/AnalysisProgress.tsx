import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  currentIndex: number;
  total: number;
}

export function AnalysisProgress({ currentIndex, total }: AnalysisProgressProps) {
  const progress = (currentIndex / (total || 1)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Analysis Progress</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-secondary/30" 
      />
      <p className="text-sm text-muted-foreground/80">
        Analyzing coin {currentIndex + 1} of {total}
      </p>
    </div>
  );
}