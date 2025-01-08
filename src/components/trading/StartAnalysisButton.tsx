import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface StartAnalysisButtonProps {
  onClick: () => void;
}

export function StartAnalysisButton({ onClick }: StartAnalysisButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Button onClick={onClick} size="lg" className="gap-2">
        <Play className="w-4 h-4" />
        Start Analysis
      </Button>
    </div>
  );
}