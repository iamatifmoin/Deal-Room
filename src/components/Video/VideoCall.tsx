import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { toggleMute, toggleVideo } from "../../store/slices/videoSlice";
import { useWebRTC } from "../../hooks/useWebRTC";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  PhoneOff,
} from "lucide-react";

interface VideoCallProps {
  dealId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ dealId }) => {
  const dispatch = useAppDispatch();
  const { isCallActive, isConnecting, remoteUser, isMuted, isVideoOff } =
    useAppSelector((state) => state.video);

  const {
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMute: handleToggleMute,
    toggleVideo: handleToggleVideo,
  } = useWebRTC(dealId);

  // useEffect(() => {
  //   handleToggleMute();
  // }, [isMuted]);

  // useEffect(() => {
  //   handleToggleVideo();
  // }, [isVideoOff]);

  const handleMuteClick = () => {
    dispatch(toggleMute());
    handleToggleMute(); // after dispatch — uses latest state
  };

  const handleVideoClick = () => {
    dispatch(toggleVideo());
    handleToggleVideo();
  };

  if (!isCallActive && !isConnecting) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="mb-4">
          <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-white">Video Call</h3>
          <p className="text-gray-400">
            Start a video call to discuss the deal
          </p>
        </div>
        <button
          onClick={startCall}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center space-x-2 mx-auto"
        >
          <VideoIcon className="h-5 w-5" />
          <span>Start Call</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="relative">
        {/* Remote Video */}
        <div className="relative bg-gray-900 aspect-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-white">Connecting...</p>
              </div>
            </div>
          )}
          {remoteUser && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-white text-sm">{remoteUser.username}</span>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-900 flex items-center justify-center space-x-4">
        <button
          onClick={handleMuteClick}
          className={`p-3 rounded-full transition-colors ${
            isMuted
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? (
            <MicOff className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </button>

        <button
          onClick={handleVideoClick}
          className={`p-3 rounded-full transition-colors ${
            isVideoOff
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="h-5 w-5 text-white" />
          ) : (
            <VideoIcon className="h-5 w-5 text-white" />
          )}
        </button>

        <button
          onClick={endCall}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
