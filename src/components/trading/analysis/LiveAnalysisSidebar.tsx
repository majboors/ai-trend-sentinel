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
    <div
      className={cn(
        "fixed inset-y-0 right-0 bg-sidebar border-l border-sidebar-border transform transition-all duration-200 ease-in-out z-50 shadow-xl flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full",
        isFullScreen ? "w-full" : "w-80"
      )}
      style={{ 
        top: 0, 
        bottom: 0, 
        paddingTop: 0, 
        marginTop: 0,
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
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
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
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