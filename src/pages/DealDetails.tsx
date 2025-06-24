import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { setCurrentDeal } from '../store/slices/dealsSlice';
import { setCallActive } from '../store/slices/videoSlice';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import DealNegotiation from '../components/Deal/DealNegotiation';
import ChatWindow from '../components/Chat/ChatWindow';
import VideoCall from '../components/Video/VideoCall';
import DocumentUpload from '../components/Documents/DocumentUpload';
import api from '../services/api';

const DealDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentDeal } = useAppSelector(state => state.deals);
  const { isCallActive } = useAppSelector(state => state.video);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDeal(id);
    }
  }, [id]);

  const loadDeal = async (dealId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/deals/${dealId}`);
      dispatch(setCurrentDeal(response.data));
    } catch (error) {
      console.error('Failed to load deal:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVideoCall = () => {
    dispatch(setCallActive(true));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentDeal) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Deal not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentDeal.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(currentDeal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Buyer: {currentDeal.buyer.username}</span>
              </div>
              {currentDeal.seller && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Seller: {currentDeal.seller.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <p className="text-gray-300">{currentDeal.description}</p>
            </div>

            <DealNegotiation deal={currentDeal} />
            
            {isCallActive ? (
              <VideoCall dealId={currentDeal._id} />
            ) : (
              <ChatWindow 
                dealId={currentDeal._id} 
                onStartVideoCall={handleStartVideoCall}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DocumentUpload deal={currentDeal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetails;