import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Bell } from "lucide-react";
import { sendTradeNotification } from "@/utils/notificationService";

interface NotificationSlidersProps {
  symbol: string;
  currentPrice: number;
}

export function NotificationSliders({ symbol, currentPrice }: NotificationSlidersProps) {
  const [showSliders, setShowSliders] = useState(false);
  const [highValue, setHighValue] = useState([currentPrice]);
  const [lowValue, setLowValue] = useState([currentPrice]);

  const handleHighPresetClick = (percentage: number) => {
    const newValue = currentPrice + (currentPrice * (percentage / 100));
    setHighValue([newValue]);
  };

  const handleLowPresetClick = (percentage: number) => {
    const newValue = currentPrice - (currentPrice * (percentage / 100));
    setLowValue([newValue]);
  };

  const handlePriceCheck = async () => {
    const highPercentChange = ((highValue[0] - currentPrice) / currentPrice) * 100;
    const lowPercentChange = ((lowValue[0] - currentPrice) / currentPrice) * 100;

    if (highPercentChange >= 25) {
      await sendTradeNotification(
        symbol,
        'UP',
        highPercentChange,
        'Price Alert',
        highValue[0] - currentPrice
      );
    }

    if (lowPercentChange <= -25) {
      await sendTradeNotification(
        symbol,
        'DOWN',
        Math.abs(lowPercentChange),
        'Price Alert',
        currentPrice - lowValue[0]
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Toggle
          aria-label="Toggle notifications"
          pressed={showSliders}
          onPressedChange={setShowSliders}
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </Toggle>
      </div>

      {showSliders && (
        <div className="space-y-6 p-4 border rounded-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High Price Alert: ${highValue[0].toFixed(2)}</span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleHighPresetClick(25)}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleHighPresetClick(50)}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleHighPresetClick(75)}
                >
                  75%
                </Button>
              </div>
            </div>
            <Slider
              value={highValue}
              onValueChange={setHighValue}
              max={currentPrice * 2}
              min={currentPrice}
              step={0.01}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Low Price Alert: ${lowValue[0].toFixed(2)}</span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLowPresetClick(25)}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLowPresetClick(50)}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLowPresetClick(75)}
                >
                  75%
                </Button>
              </div>
            </div>
            <Slider
              value={lowValue}
              onValueChange={setLowValue}
              max={currentPrice}
              min={currentPrice * 0.1}
              step={0.01}
            />
          </div>
        </div>
      )}
    </div>
  );
}