import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TelemetryData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gesture: string;
  confidence: number;
  accuracy: number;
  speed: number;
  elapsedTime: number;
}

export const useSocket = (
  socketUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  onTelemetryReceived?: (data: TelemetryData) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    
    // Initialize Socket.io client
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('Successfully connected to AI Real-time Socket Server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsConnecting(false);
      console.log('Disconnected from AI Real-time Socket Server');
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error, utilizing fallback local simulation:', error.message);
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Listen for real-time telemetry updates from AI server
    socket.on('telemetry_update', (data: TelemetryData) => {
      if (onTelemetryReceived) {
        onTelemetryReceived(data);
      }
    });

    socketRef.current = socket;
  }, [socketUrl, onTelemetryReceived]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Send a video frame (base64) to the AI server for pose-detection
  const sendVideoFrame = useCallback((base64Frame: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('video_frame', { frame: base64Frame });
    }
  }, [isConnected]);

  // Start training session
  const startSession = useCallback((scenarioId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('start_session', { scenarioId });
    }
  }, [isConnected]);

  // Pause training session
  const pauseSession = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('pause_session');
    }
  }, [isConnected]);

  // Reset training session
  const resetSession = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('reset_session');
    }
  }, [isConnected]);

  // Update AI settings
  const updateSettings = useCallback((settings: { sensitivity: number }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_settings', settings);
    }
  }, [isConnected]);

  useEffect(() => {
    // Auto-connect on mount
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendVideoFrame,
    startSession,
    pauseSession,
    resetSession,
    updateSettings,
  };
};
