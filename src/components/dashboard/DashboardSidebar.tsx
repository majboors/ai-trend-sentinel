import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Coins,
  DollarSign,
  FolderTree,
  Home,
  LineChart,
  Settings,
  ShoppingBag,
  ShoppingCart,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/" },
  {
    title: "All Coins",
    icon: FolderTree,
    url: "/coins",
    items: [
      { title: "Profit", icon: BarChart3, url: "/coins?filter=profit" },
      { title: "Loss", icon: DollarSign, url: "/coins?filter=loss" },
      { title: "Sentiment", icon: MessageSquare, url: "/coins/sentiment" },
    ],
  },
  {
    title: "Predictions",
    icon: LineChart,
    url: "/predictions",
    items: [
      { title: "Overview", icon: BarChart3, url: "/predictions" },
      { title: "Profits", icon: BarChart3, url: "/predictions/profits" },
      { title: "Losses", icon: DollarSign, url: "/predictions/losses" },
      { title: "Settings", icon: Settings, url: "/predictions/settings" },
    ],
  },
  {
    title: "Trading",
    icon: ArrowLeftRight,
    url: "/trading/bought",
    items: [
      { title: "Bought", icon: ShoppingCart, url: "/trading/bought" },
      { title: "Sold", icon: ShoppingBag, url: "/trading/sold" },
      { title: "Volatile", icon: TrendingUp, url: "/trading/volatile" },
    ],
  },
  {
    title: "Assets",
    icon: Wallet,
    url: "/assets",
    items: [
      { title: "Overview", icon: BarChart3, url: "/assets" },
      { title: "Spent/Profits", icon: DollarSign, url: "/spent-profits" },
      { title: "Leverage", icon: Coins, url: "/leverage" },
    ],
  },
];

export function DashboardSidebar() {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar>
      <div className="flex items-center p-2">
        <SidebarTrigger onClick={toggleSidebar} />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton asChild={!item.url}>
                        {item.url ? (
                          <Link to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        ) : (
                          <>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </>
                        )}
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link to={subItem.url} className="flex items-center gap-2">
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton asChild>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}