import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, KeyIcon, AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeys {
  binance_api_key: string;
  binance_api_secret: string;
}

export const ApiKeysManager = () => {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    binance_api_key: "",
    binance_api_secret: "",
  });

  const fetchApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to view API keys");
        return;
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("binance_api_key, binance_api_secret")
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching API keys:", error);
        setError("Failed to fetch API keys");
        return;
      }

      if (data) {
        setApiKeys(data);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      setError("Failed to fetch API keys");
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update API keys",
          variant: "destructive",
        });
        return;
      }

      // Validate API keys are not empty
      if (!apiKeys.binance_api_key || !apiKeys.binance_api_secret) {
        setError("Both API key and secret are required");
        toast({
          title: "Error",
          description: "Both API key and secret are required",
          variant: "destructive",
        });
        return;
      }

      console.log("Attempting to upsert API keys for user:", session.user.id);
      
      const { error: upsertError } = await supabase
        .from("api_keys")
        .upsert({
          user_id: session.user.id,
          binance_api_key: apiKeys.binance_api_key,
          binance_api_secret: apiKeys.binance_api_secret,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error("Error upserting API keys:", upsertError);
        throw upsertError;
      }

      toast({
        title: "Success",
        description: "API keys updated successfully",
      });
      
      // Refresh the page to reload assets with new keys
      window.location.reload();
    } catch (error) {
      console.error("Error updating API keys:", error);
      setError("Failed to update API keys");
      toast({
        title: "Error",
        description: "Failed to update API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Manage your Binance API keys. These keys are required to fetch your account data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type={showSecrets ? "text" : "password"}
              value={apiKeys.binance_api_key}
              onChange={(e) =>
                setApiKeys({ ...apiKeys, binance_api_key: e.target.value })
              }
              placeholder="Enter your Binance API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type={showSecrets ? "text" : "password"}
              value={apiKeys.binance_api_secret}
              onChange={(e) =>
                setApiKeys({ ...apiKeys, binance_api_secret: e.target.value })
              }
              placeholder="Enter your Binance API secret"
            />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? (
                <>
                  <EyeOffIcon className="h-4 w-4 mr-2" />
                  Hide Keys
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Show Keys
                </>
              )}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update API Keys"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};