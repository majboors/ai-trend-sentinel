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
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

type MenuItem = {
  title: string;
  icon: any;
  url?: string;
  items?: SubMenuItem[];
};

type SubMenuItem = {
  title: string;
  icon: any;
  url?: string;
  items?: {
    title: string;
    icon: any;
    url: string;
  }[];
};

const menuItems: MenuItem[] = [
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
      {
        title: "Trading",
        icon: ArrowLeftRight,
        items: [
          { title: "Bought", icon: ShoppingCart, url: "/trading/bought" },
          { title: "Sold", icon: ShoppingBag, url: "/trading/sold" },
        ],
      },
      {
        title: "Assets",
        icon: Wallet,
        items: [
          { title: "Overview", icon: BarChart3, url: "/assets" },
          { title: "Spent/Profits", icon: DollarSign, url: "/spent-profits" },
          { title: "Leverage", icon: Coins, url: "/leverage" },
        ],
      },
    ],
  },
];

export function DashboardSidebar() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

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
                    <Collapsible open={openSections[item.title]} onOpenChange={() => toggleSection(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${openSections[item.title] ? 'transform rotate-180' : ''}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) =>
                            subItem.items ? (
                              <SidebarMenuItem key={subItem.title}>
                                <Collapsible open={openSections[subItem.title]} onOpenChange={() => toggleSection(subItem.title)}>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuButton className="w-full flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <subItem.icon className="h-4 w-4" />
                                        <span>{subItem.title}</span>
                                      </div>
                                      <ChevronDown className={`h-4 w-4 transition-transform ${openSections[subItem.title] ? 'transform rotate-180' : ''}`} />
                                    </SidebarMenuButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
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
                                  </CollapsibleContent>
                                </Collapsible>
                              </SidebarMenuItem>
                            ) : (
                              <SidebarMenuItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    to={subItem.url || '/'}
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
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <Link to={item.url || '/'} className="flex items-center gap-2">
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