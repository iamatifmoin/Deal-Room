import React, { useState } from "react";
import { Deal } from "../../types";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { updateDeal } from "../../store/slices/dealsSlice";
import { DollarSign, Check, X, MessageSquare } from "lucide-react";
import api from "../../services/api";

interface DealNegotiationProps {
  deal: Deal;
}

const DealNegotiation: React.FC<DealNegotiationProps> = ({ deal }) => {
  const [counterOffer, setCounterOffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const canCounter =
    user?.role === "seller" && ["pending", "in_progress"].includes(deal.status);

  const canAccept = user?.role === "seller" && deal.status === "pending";
  const canComplete =
    (user?.role === "seller" || user?.role === "buyer") &&
    deal.status === "in_progress";

  const isBuyer = user?.role === "buyer";

  const handleAcceptDeal = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.patch(`/deals/${deal._id}/accept`);
      dispatch(updateDeal(response.data));
    } catch (err: any) {
      setError(err.message || "Failed to accept deal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeal = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.patch(`/deals/${deal._id}/cancel`);
      dispatch(updateDeal(response.data));
    } catch (err: any) {
      setError(err.message || "Failed to cancel deal");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDeal = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.patch(`/deals/${deal._id}/complete`);
      dispatch(updateDeal(response.data));
    } catch (err: any) {
      setError(err.message || "Failed to complete deal");
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterOffer) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.patch(`/deals/${deal._id}/counter`, {
        price: parseFloat(counterOffer),
      });
      dispatch(updateDeal(response.data));
      setCounterOffer("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit counter offer"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "in_progress":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Deal Negotiation</h2>
        <span className={`font-medium ${getStatusColor(deal.status)}`}>
          {deal.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-4">
          <DollarSign className="h-5 w-5 text-green-400" />
          <div>
            <span className="text-gray-300">Current Price: </span>
            <span className="text-white font-semibold text-lg">
              {formatPrice(deal.currentPrice)}
            </span>
          </div>
        </div>

        {deal.proposedPrice !== deal.currentPrice && (
          <div className="flex items-center space-x-4">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <div>
              <span className="text-gray-300">Original Proposal: </span>
              <span className="text-gray-400">
                {formatPrice(deal.proposedPrice)}
              </span>
            </div>
          </div>
        )}
      </div>

      {canCounter && (
        <div className="space-y-4">
          <form onSubmit={handleCounterOffer} className="flex space-x-3">
            <div className="flex-1">
              <input
                type="number"
                value={counterOffer}
                onChange={(e) => setCounterOffer(e.target.value)}
                placeholder="Enter counter offer"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!counterOffer || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {canAccept && (
        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleAcceptDeal}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Accept Deal</span>
          </button>
          <button
            onClick={handleCancelDeal}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span>Reject Deal</span>
          </button>
        </div>
      )}

      {canComplete && (
        <div className="text-center mt-4">
          <button
            onClick={handleCompleteDeal}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 font-semibold"
          >
            Complete Deal
          </button>
        </div>
      )}

      {isBuyer && deal.status === "pending" && (
        <div className="text-center text-gray-400 mt-4">
          <p>Waiting for seller response...</p>
        </div>
      )}
    </div>
  );
};

export default DealNegotiation;
