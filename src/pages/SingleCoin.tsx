import { useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const SingleCoin = () => {
  const { id } = useParams();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Coin Details</h1>
            <p>Viewing coin with ID: {id}</p>
            {/* Add more coin details here */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SingleCoin;