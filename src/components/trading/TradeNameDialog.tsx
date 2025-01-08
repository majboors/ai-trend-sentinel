import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TradeNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

export function TradeNameDialog({ open, onOpenChange, onSubmit }: TradeNameDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name);
      setName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name Your Trading View</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tradeName">Trading View Name</Label>
            <Input
              id="tradeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your trading view"
            />
          </div>
          <Button type="submit">Start Analysis</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}