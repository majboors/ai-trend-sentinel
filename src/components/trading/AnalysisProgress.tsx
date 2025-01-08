import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  currentIndex: number;
  total: number;
}

export function AnalysisProgress({ currentIndex, total }: AnalysisProgressProps) {
  const progress = (currentIndex / (total || 1)) * 100;

  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground">
        Analyzing coin {currentIndex + 1} of {total}
      </p>
    </div>
  );
}