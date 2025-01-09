import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export function IpDisplay() {
  const [ip, setIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-ip');
        if (error) throw error;
        setIp(data.ip);
      } catch (err) {
        console.error('Error fetching IP:', err);
        setError('Failed to fetch IP address');
      }
    };

    fetchIp();
  }, []);

  if (error) {
    return (
      <Card className="p-4 mb-4 bg-red-50 text-red-700">
        <p>{error}</p>
      </Card>
    );
  }

  if (!ip) {
    return (
      <Card className="p-4 mb-4">
        <p className="text-muted-foreground">Fetching IP address...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <p className="text-sm text-muted-foreground">Your IP address: <span className="font-medium text-foreground">{ip}</span></p>
    </Card>
  );
}