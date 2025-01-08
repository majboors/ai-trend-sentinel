import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

interface LiveAnalysisSidebarProps {
  onClose: () => void;
}

export function LiveAnalysisSidebar({ onClose }: LiveAnalysisSidebarProps) {
  return (
    <Sidebar side="right" variant="floating" className="border-l border-border">
      <SidebarHeader className="p-4 flex justify-between items-center border-b border-border">
        <h3 className="text-lg font-semibold">Live Analysis</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Market Data</SidebarGroupLabel>
          <SidebarGroupContent className="p-4">
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Price Action</h4>
                <div className="text-sm text-muted-foreground">
                  Live price data will appear here
                </div>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Volume Analysis</h4>
                <div className="text-sm text-muted-foreground">
                  Volume metrics will appear here
                </div>
              </div>
              <div className="border border-border rounded-lg p-4">
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