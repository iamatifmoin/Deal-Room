import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  setLocalStream,
  setRemoteStream,
  setConnecting,
  setCallActive,
  resetVideoCall,
} from "../store/slices/videoSlice";
import { socketService } from "../services/socket";

export const useWebRTC = (dealId: string) => {
  const dispatch = useAppDispatch();
  const { isCallActive, isMuted, isVideoOff } = useAppSelector(
    (state) => state.video
  );

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const initializePeerConnection = () => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    peerConnection.current = new RTCPeerConnection(config);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(dealId, "targetUserId", event.candidate);
      }
    };

    peerConnection.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      dispatch(setRemoteStream(remoteStream));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      if (state === "connected") {
        dispatch(setCallActive(true));
        dispatch(setConnecting(false));
      } else if (state === "disconnected" || state === "failed") {
        endCall();
      }
    };
  };

  const startCall = async () => {
    try {
      dispatch(setConnecting(true));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      dispatch(setLocalStream(stream));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initializePeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);

      if (offer) {
        socketService.sendVideoCallOffer(dealId, "targetUserId", offer);
      }
    } catch (error) {
      console.error("Error starting call:", error);
      dispatch(setConnecting(false));
    }
  };

  const answerCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      dispatch(setConnecting(true));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      dispatch(setLocalStream(stream));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initializePeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      await peerConnection.current?.setRemoteDescription(offer);
      const answer = await peerConnection.current?.createAnswer();
      await peerConnection.current?.setLocalDescription(answer);

      if (answer) {
        socketService.sendVideoCallAnswer(dealId, "targetUserId", answer);
      }
    } catch (error) {
      console.error("Error answering call:", error);
      dispatch(setConnecting(false));
    }
  };

  const endCall = () => {
    const localStream = localVideoRef.current?.srcObject as MediaStream;
    localStream?.getTracks().forEach((track) => track.stop());

    peerConnection.current?.close();
    peerConnection.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    dispatch(resetVideoCall());
    socketService.endVideoCall(dealId, "targetUserId");
  };

  const toggleMute = () => {
    const localStream = localVideoRef.current?.srcObject as MediaStream;
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMuted;
    }
  };

  const toggleVideo = () => {
    const localStream = localVideoRef.current?.srcObject as MediaStream;
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isVideoOff;
    }
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
