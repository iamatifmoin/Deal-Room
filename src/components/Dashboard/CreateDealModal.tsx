import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { addDeal } from "../../store/slices/dealsSlice";
import api from "../../services/api";
import axios from "axios";
import { User } from "../../types";

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Seller = User;

const CreateDealModal: React.FC<CreateDealModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    proposedPrice: "",
    sellerId: selectedSellerId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sellers, setSellers] = useState<Seller[]>([]);

  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/deals", {
        ...formData,
        sellerId: selectedSellerId,
        proposedPrice: parseFloat(formData.proposedPrice),
      });
      dispatch(addDeal(response.data));
      onClose();
      setFormData({
        title: "",
        description: "",
        proposedPrice: "",
        sellerId: "",
      });
      setSelectedSellerId("");
    } catch (err: any) {
      setError(err.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await api.get("/users?role=seller");
        setSellers(res);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };
    fetchSellers();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Deal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Deal Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter deal title"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your deal"
            />
          </div>

          <label className="block text-sm font-medium mb-1 text-gray-300">
            Select Seller
          </label>
          <select
            className="border rounded p-2 w-full"
            value={selectedSellerId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSellerId(value);
              setFormData((prev) => ({
                ...prev,
                sellerId: value,
              }));
            }}
          >
            <option value="">Choose a seller</option>
            {sellers &&
              Array.isArray(sellers) &&
              sellers.map((seller) => (
                <option key={seller._id} value={seller._id}>
                  {seller.username} ({seller.email})
                </option>
              ))}
          </select>

          <div>
            <label
              htmlFor="proposedPrice"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Proposed Price ($)
            </label>
            <input
              type="number"
              id="proposedPrice"
              name="proposedPrice"
              required
              min="0"
              step="0.01"
              value={formData.proposedPrice}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealModal;
