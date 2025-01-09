import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { sendTradeNotification } from "@/utils/notificationService";

interface NotificationControlsProps {
  coin: string;
  currentPrice: number;
}

export function NotificationControls({ coin, currentPrice }: NotificationControlsProps) {
  const [showSliders, setShowSliders] = useState(false);
  const [highPrice, setHighPrice] = useState([currentPrice]);
  const [lowPrice, setLowPrice] = useState([currentPrice]);

  const calculatePercentage = (value: number, basePrice: number) => {
    return ((value - basePrice) / basePrice) * 100;
  };

  const handlePresetClick = (percentage: number, isHigh: boolean) => {
    const newValue = currentPrice * (1 + (percentage / 100) * (isHigh ? 1 : -1));
    if (isHigh) {
      setHighPrice([newValue]);
    } else {
      setLowPrice([newValue]);
    }
  };

  const handleHighPriceChange = (values: number[]) => {
    setHighPrice(values);
    const percentage = calculatePercentage(values[0], currentPrice);
    if (percentage > 0) {
      sendTradeNotification(coin, 'UP', percentage, 'Trading View', percentage * currentPrice);
    }
  };

  const handleLowPriceChange = (values: number[]) => {
    setLowPrice(values);
    const percentage = calculatePercentage(values[0], currentPrice);
    if (percentage < 0) {
      sendTradeNotification(coin, 'DOWN', Math.abs(percentage), 'Trading View', Math.abs(percentage * currentPrice));
    }
  };

  return (
    <div className="space-y-4">
      <Toggle 
        pressed={showSliders}
        onPressedChange={setShowSliders}
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        Notifications
      </Toggle>

      {showSliders && (
        <Card className="p-4 space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">High Price Alert</h4>
            <Slider
              value={highPrice}
              onValueChange={handleHighPriceChange}
              max={currentPrice * 2}
              min={currentPrice}
              step={currentPrice * 0.01}
              className="w-full"
            />
            <div className="flex gap-2">
              {[25, 50, 75].map((percent) => (
                <Button
                  key={`high-${percent}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(percent, true)}
                >
                  +{percent}%
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(100, true)}
              >
                &gt;75%
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current: ${highPrice[0].toFixed(2)} ({calculatePercentage(highPrice[0], currentPrice).toFixed(2)}%)
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Low Price Alert</h4>
            <Slider
              value={lowPrice}
              onValueChange={handleLowPriceChange}
              max={currentPrice}
              min={currentPrice * 0.5}
              step={currentPrice * 0.01}
              className="w-full"
            />
            <div className="flex gap-2">
              {[25, 50, 75].map((percent) => (
                <Button
                  key={`low-${percent}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(percent, false)}
                >
                  -{percent}%
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(100, false)}
              >
                &gt;75%
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current: ${lowPrice[0].toFixed(2)} ({calculatePercentage(lowPrice[0], currentPrice).toFixed(2)}%)
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}