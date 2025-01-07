import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Coins,
  DollarSign,
  FileText,
  FolderTree,
  Home,
  LineChart,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Swap,
  TrendingDown,
  TrendingUp,
  Wallet,
  Brain,
  Users,
  Smile,
} from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  {
    title: "Pages",
    icon: FileText,
    items: [
      { title: "Dashboard", icon: Home, url: "/" },
      {
        title: "All Coins",
        icon: FolderTree,
        items: [
          { title: "Profit View", icon: TrendingUp, url: "/coins/profit" },
          { title: "Loss View", icon: TrendingDown, url: "/coins/loss" },
        ],
      },
      {
        title: "Predictions",
        icon: LineChart,
        items: [
          { title: "Profits", icon: TrendingUp, url: "/predictions/profits" },
          { title: "Losses", icon: TrendingDown, url: "/predictions/losses" },
          { title: "Settings", icon: Settings, url: "/predictions/settings" },
        ],
      },
    ],
  },
  {
    title: "Trading",
    icon: Swap,
    items: [
      { title: "Bought", icon: ShoppingCart, url: "/trading/bought" },
      { title: "Sold", icon: ShoppingBag, url: "/trading/sold" },
    ],
  },
  { title: "Assets", icon: Wallet, url: "/assets" },
  { title: "Spent/Profits", icon: DollarSign, url: "/spent-profits" },
  { title: "Leverage", icon: Coins, url: "/leverage" },
  {
    title: "Single Coin",
    icon: BarChart3,
    items: [
      { title: "Technical Analysis", icon: LineChart, url: "/coin/analysis" },
      { title: "Sentiment", icon: Smile, url: "/coin/sentiment" },
      { title: "Strategies", icon: Brain, url: "/coin/strategies" },
      { title: "Whales", icon: Users, url: "/coin/whales" },
    ],
  },
];

export function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) =>
                          subItem.items ? (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton className="flex items-center gap-2">
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </SidebarMenuButton>
                              <SidebarMenuSub>
                                {subItem.items.map((subSubItem) => (
                                  <SidebarMenuItem key={subSubItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <Link
                                        to={subSubItem.url}
                                        className="flex items-center gap-2"
                                      >
                                        <subSubItem.icon className="h-4 w-4" />
                                        <span>{subSubItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenuSub>
                            </SidebarMenuItem>
                          ) : (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  to={subItem.url}
                                  className="flex items-center gap-2"
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuItem>
                          )
                        )}
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
    </Sidebar>
  );
}