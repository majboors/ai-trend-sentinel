import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface ApiKeys {
  binance_api_key: string;
  binance_api_secret: string;
}

export const ApiKeysManager = () => {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    binance_api_key: "",
    binance_api_secret: "",
  });

  const fetchApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("api_keys")
        .select("binance_api_key, binance_api_secret")
        .single();

      if (error) throw error;
      if (data) {
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    }
  };

  useState(() => {
    fetchApiKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      const { error } = await supabase
        .from("api_keys")
        .upsert({
          user_id: session.user.id,
          binance_api_key: apiKeys.binance_api_key,
          binance_api_secret: apiKeys.binance_api_secret,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API keys updated successfully",
      });
    } catch (error) {
      console.error("Error updating API keys:", error);
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
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage your Binance API keys. These keys are required to fetch your account data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex space-x-2">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <div className="flex space-x-2">
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