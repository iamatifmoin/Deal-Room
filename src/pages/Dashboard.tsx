import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import { setDeals, setLoading } from "../store/slices/dealsSlice";
import { Plus, Filter } from "lucide-react";
import DealCard from "../components/Dashboard/DealCard";
import CreateDealModal from "../components/Dashboard/CreateDealModal";
import api from "../services/api";

const Dashboard: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { deals, loading } = useAppSelector((state) => state.deals);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    dispatch(setLoading(true));
    try {
      const response = await api.get("/deals");
      dispatch(setDeals(response.data));
    } catch (error) {
      console.error("Failed to load deals:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const filteredDeals = deals.filter((deal) => {
    if (statusFilter === "all") return true;
    return deal.status === statusFilter;
  });

  const getStatusCount = (status: string) => {
    if (status === "all") return deals.length;
    return deals.filter((deal) => deal.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Welcome back, {user?.username}! Here are your deals.
            </p>
          </div>

          {user?.role === "buyer" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Deal</span>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-2">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "in_progress", label: "In Progress" },
              { key: "completed", label: "Completed" },
              { key: "cancelled", label: "Cancelled" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {label} ({getStatusCount(key)})
              </button>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        {filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {deals.length === 0
                ? "No deals found. Create your first deal to get started!"
                : "No deals match the selected filter."}
            </div>
            {user?.role === "buyer" && deals.length === 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Your First Deal
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => (
              <DealCard key={deal._id} deal={deal} />
            ))}
          </div>
        )}

        <CreateDealModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;
