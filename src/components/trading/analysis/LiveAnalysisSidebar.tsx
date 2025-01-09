import { cn } from "@/lib/utils";

interface LiveAnalysisSidebarProps {
  isOpen: boolean;
}

export function LiveAnalysisSidebar({ isOpen }: LiveAnalysisSidebarProps) {
  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-80 bg-sidebar border-l border-sidebar-border transform transition-transform duration-200 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Live Analysis</h3>
        <div className="space-y-4">
          {/* Add your live analysis content here */}
          <p className="text-muted-foreground">Real-time market data and analysis will appear here...</p>
        </div>
      </div>
    </div>
  );
}