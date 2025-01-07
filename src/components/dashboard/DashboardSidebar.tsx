import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Settings,
  ChartPieIcon,
  LineChart,
  BarChart3,
  ArrowRightLeft,
} from "lucide-react";

export function DashboardSidebar() {
  const location = useLocation();

  return (
    <ScrollArea className="h-screen w-full border-r bg-background py-6 md:w-64">
      <div className="flex h-full flex-col gap-4">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold" to="/">
            <Wallet className="h-6 w-6" />
            <span>Trading App</span>
          </Link>
        </div>
        <div className="flex-1 px-4">
          <div className="space-y-2">
            <Button
              asChild
              variant={location.pathname === "/" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/assets" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/assets">
                <ChartPieIcon className="mr-2 h-4 w-4" />
                Assets Overview
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/assets-detailed" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/assets-detailed">
                <LineChart className="mr-2 h-4 w-4" />
                Assets Analytics
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/settings" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/trending-up" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/trending-up">
                <TrendingUp className="mr-2 h-4 w-4" />
                Trending Up
              </Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/trending-down" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link to="/trending-down">
                <TrendingDown className="mr-2 h-4 w-4" />
                Trending Down
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
