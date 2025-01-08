import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export function LiveAnalysisSidebar() {
  return (
    <Sidebar side="right" variant="floating">
      <SidebarHeader className="p-4">
        <h3 className="text-lg font-semibold">Live Analysis</h3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Market Data</SidebarGroupLabel>
          <SidebarGroupContent className="p-4">
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h4 className="font-medium mb-2">Price Action</h4>
                <div className="text-sm text-muted-foreground">
                  Live price data will appear here
                </div>
              </div>
              <div className="glass-card p-4">
                <h4 className="font-medium mb-2">Volume Analysis</h4>
                <div className="text-sm text-muted-foreground">
                  Volume metrics will appear here
                </div>
              </div>
              <div className="glass-card p-4">
                <h4 className="font-medium mb-2">Technical Indicators</h4>
                <div className="text-sm text-muted-foreground">
                  Technical analysis data will appear here
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}