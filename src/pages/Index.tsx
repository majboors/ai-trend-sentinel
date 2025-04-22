
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { WhalesActivity } from "@/components/dashboard/WhalesActivity";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-background-foreground transition-colors duration-300">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {!session ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        Sign In
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Authentication</DialogTitle>
                        <DialogDescription>
                          Sign in to your account or create a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <Auth
                        supabaseClient={supabase}
                        appearance={{ 
                          theme: ThemeSupa,
                          variables: {
                            default: {
                              colors: {
                                brand: 'hsl(var(--primary))',
                                brandAccent: 'hsl(var(--primary))',
                              },
                            },
                          },
                        }}
                        theme="default"
                        providers={[]}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast({
                        title: "Signed out",
                        description: "You have been signed out successfully.",
                      });
                    }}
                  >
                    Sign Out
                  </Button>
                )}
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in">
              <ProfitLossCard
                title="Total Profit/Loss"
                value={5000}
                percentage={12.5}
              />
              <ProfitLossCard
                title="Today's Change"
                value={-250}
                percentage={-2.3}
              />
              <ProfitLossCard
                title="Weekly Profit"
                value={1200}
                percentage={5.7}
              />
              <ProfitLossCard
                title="Monthly Profit"
                value={8500}
                percentage={15.2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-2 bg-card rounded-lg p-4 shadow-md">
                <PerformanceChart />
              </div>
              <div className="bg-card rounded-lg p-4 shadow-md">
                <MarketSentiment />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <div className="bg-card rounded-lg p-4 shadow-md">
                <WhalesActivity />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
