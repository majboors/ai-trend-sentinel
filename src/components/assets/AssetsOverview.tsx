import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface Asset {
  symbol: string;
  free: number;
  locked: number;
  account_type: string;
}

interface AssetsOverviewProps {
  assets: Asset[];
  isLoading: boolean;
}

export const AssetsOverview = ({ assets, isLoading }: AssetsOverviewProps) => {
  // Prepare data for the charts
  const spotAssets = assets.filter((asset) => asset.account_type === "spot");
  const marginAssets = assets.filter((asset) => asset.account_type === "margin");

  const spotData = spotAssets.map((asset) => ({
    name: asset.symbol,
    value: asset.free + asset.locked,
  }));

  const marginData = marginAssets.map((asset) => ({
    name: asset.symbol,
    value: asset.free + asset.locked,
  }));

  const chartConfig = {
    spot: {
      color: "#22c55e",
      theme: {
        light: "#dcfce7",
        dark: "#166534",
      },
    },
    margin: {
      color: "#3b82f6",
      theme: {
        light: "#dbeafe",
        dark: "#1e40af",
      },
    },
  };

  if (isLoading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spot Assets Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spotData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartConfig.spot.color}
                    fill={chartConfig.spot.theme.light}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Margin Assets Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marginData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartConfig.margin.color}
                    fill={chartConfig.margin.theme.light}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};