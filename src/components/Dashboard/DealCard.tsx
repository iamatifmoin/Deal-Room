import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Deal } from '../../types';
import { Calendar, DollarSign, User, Clock } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 text-yellow-300';
      case 'in_progress':
        return 'bg-blue-900 text-blue-300';
      case 'completed':
        return 'bg-green-900 text-green-300';
      case 'cancelled':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div
      onClick={() => navigate(`/deals/${deal._id}`)}
      className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer border border-gray-700 hover:border-gray-600"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white truncate">
          {deal.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
          {deal.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {deal.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-300">
          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
          <span>Current: {formatPrice(deal.currentPrice)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-300">
          <User className="h-4 w-4 mr-2 text-blue-400" />
          <span>Buyer: {deal.buyer.username}</span>
        </div>

        {deal.seller && (
          <div className="flex items-center text-sm text-gray-300">
            <User className="h-4 w-4 mr-2 text-green-400" />
            <span>Seller: {deal.seller.username}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(deal.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(deal.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default DealCard;