import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwitterFeed } from "./TwitterFeed";

interface LiveAnalysisSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  currentCoin?: string;
}

export function LiveAnalysisSidebar({ isOpen, onClose, currentCoin }: LiveAnalysisSidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-80 bg-sidebar border-l border-sidebar-border transform transition-transform duration-200 ease-in-out z-50 shadow-xl flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      style={{ top: 0, bottom: 0, paddingTop: 0, marginTop: 0 }}
    >
      <div className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
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
      </div>
      <div className="flex-1 overflow-auto">
        {currentCoin ? (
          <TwitterFeed coinSymbol={currentCoin} />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Select a coin to view tweets
          </div>
        )}
      </div>
    </div>
  );
}