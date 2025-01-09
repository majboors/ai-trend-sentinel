import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { IpDisplay } from "./IpDisplay";

interface StartAnalysisButtonProps {
  onClick: () => void;
}

export function StartAnalysisButton({ onClick }: StartAnalysisButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-semibold text-foreground/90">Start Trading Analysis</h2>
        <p className="text-muted-foreground">Begin analyzing coins for trading opportunities</p>
      </div>
      <IpDisplay />
      <Button 
        onClick={onClick} 
        size="lg" 
        className="gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Play className="w-5 h-5" />
        Start Analysis
      </Button>
    </div>
  );
}