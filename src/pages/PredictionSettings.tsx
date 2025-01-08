import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type PredictionView = Database['public']['Tables']['prediction_views']['Row'];

export default function PredictionSettings() {
  const [name, setName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [initialAmount, setInitialAmount] = useState<string>("1000");
  const [views, setViews] = useState<PredictionView[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchViews();
  }, []);

  const checkAuthAndFetchViews = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access prediction settings",
        variant: "destructive",
      });
      navigate('/'); // Redirect to home or login page
      return;
    }
    fetchViews();
  };

  const fetchViews = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_views')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViews(data || []);
    } catch (error) {
      console.error('Error fetching views:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prediction views",
        variant: "destructive",
      });
    }
  };

  const handleStartPrediction = async () => {
    if (!name || !startDate || !initialAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create predictions",
          variant: "destructive",
        });
        navigate('/'); // Redirect to home or login page
        return;
      }

      const { data, error } = await supabase
        .from('prediction_views')
        .insert({
          name,
          start_date: startDate,
          initial_amount: parseFloat(initialAmount),
          current_amount: parseFloat(initialAmount),
          status: 'active' as const,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prediction view created successfully",
      });

      // Reset form
      setName("");
      setStartDate("");
      setInitialAmount("1000");
      
      // Refresh views
      await fetchViews();
      
      // Navigate to predictions overview
      navigate('/predictions');
    } catch (error) {
      console.error('Error creating view:', error);
      toast({
        title: "Error",
        description: "Failed to create prediction view. Please ensure you're signed in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (viewId: string) => {
    navigate(`/predictions/profits?view=${viewId}`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Prediction Settings</h1>
            
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Prediction View</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">View Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., January Trading"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialAmount">Initial Amount (USD)</Label>
                    <Input
                      id="initialAmount"
                      type="number"
                      min="0"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleStartPrediction}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Start Prediction"}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Existing Prediction Views</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Initial Amount</TableHead>
                      <TableHead>Current Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {views.map((view) => (
                      <TableRow 
                        key={view.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewClick(view.id)}
                      >
                        <TableCell>{view.name}</TableCell>
                        <TableCell>{new Date(view.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>${view.initial_amount.toLocaleString()}</TableCell>
                        <TableCell>${view.current_amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{view.status}</TableCell>
                      </TableRow>
                    ))}
                    {views.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No prediction views yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}