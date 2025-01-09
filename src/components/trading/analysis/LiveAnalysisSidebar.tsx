import { cn } from "@/lib/utils";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwitterFeed } from "./TwitterFeed";
import { useState } from "react";

interface LiveAnalysisSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  currentCoin?: string;
}

export function LiveAnalysisSidebar({ isOpen, onClose, currentCoin }: LiveAnalysisSidebarProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 right-0 bg-sidebar transform transition-all duration-200 ease-in-out z-50 shadow-xl flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full",
        isFullScreen ? "w-[calc(100vw-16rem)]" : "w-96",
        "border-l border-sidebar-border"
      )}
    >
      <header className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Analysis</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullScreen}
              className="hover:bg-sidebar-accent"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isFullScreen ? "Exit full screen" : "Enter full screen"}
              </span>
            </Button>
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
      </header>
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {currentCoin ? (
            <TwitterFeed coinSymbol={currentCoin} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a coin to view tweets
            </div>
          )}
        </div>
      </main>
    </aside>
  );
}