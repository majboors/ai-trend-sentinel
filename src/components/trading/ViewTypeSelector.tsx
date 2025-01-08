import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ViewTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ViewTypeSelector({ value, onValueChange }: ViewTypeSelectorProps) {
  return (
    <div className="w-[200px]">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select view type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="suggestions">Trading Suggestions</SelectItem>
          <SelectItem value="volatile">Volatility View</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}