import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AssetsAnalytics = () => {
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-analytics"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session found');

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  // Process transactions to create time-series data
  const timeSeriesData = transactions.reduce((acc: any[], transaction) => {
    const date = new Date(transaction.timestamp).toLocaleDateString();
    const existingEntry = acc.find(entry => entry.date === date);

    if (existingEntry) {
      existingEntry.value += transaction.type === 'SELL' 
        ? transaction.price * transaction.amount 
        : -(transaction.price * transaction.amount);
    } else {
      acc.push({
        date,
        value: transaction.type === 'SELL' 
          ? transaction.price * transaction.amount 
          : -(transaction.price * transaction.amount)
      });
    }

    return acc;
  }, []);

  // Calculate cumulative values
  let runningTotal = 0;
  const cumulativeData = timeSeriesData.map(entry => {
    runningTotal += entry.value;
    return {
      ...entry,
      cumulativeValue: runningTotal
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Value Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cumulativeValue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};