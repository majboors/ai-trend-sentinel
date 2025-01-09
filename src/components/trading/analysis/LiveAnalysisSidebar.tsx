import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveAnalysisSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function LiveAnalysisSidebar({ isOpen, onClose }: LiveAnalysisSidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-80 bg-sidebar border-l border-sidebar-border transform transition-transform duration-200 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h3 className="text-lg font-semibold">Live Analysis</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-4">
            {/* Add your live analysis content here */}
            <p className="text-muted-foreground">Real-time market data and analysis will appear here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}