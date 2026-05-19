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
  socketUrl: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000',
  onTelemetryReceived?: (data: TelemetryData) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Sử dụng Ref để lưu trữ callback tránh kích hoạt re-connect vòng lặp
  const onTelemetryReceivedRef = useRef(onTelemetryReceived);

  useEffect(() => {
    onTelemetryReceivedRef.current = onTelemetryReceived;
  }, [onTelemetryReceived]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    
    // Initialize Socket.io client with secure authentication token
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      auth: {
        token: 'sk_ai_7Xq9Lm2PzR8vNc4KbY1DfH6TwS3JuE5'
      }
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

    // Lắng nghe sự kiện telemetry cập nhật trạng thái máy bay từ AI Server
    socket.on('telemetry_update', (data: TelemetryData) => {
      if (onTelemetryReceivedRef.current) {
        onTelemetryReceivedRef.current(data);
      }
    });

    socketRef.current = socket;
  }, [socketUrl]); // Chỉ phụ thuộc vào socketUrl

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Send a video frame (base64) to the AI server for pose-detection
  const sendVideoFrame = useCallback((base64Frame: string, model: string = 'dnn') => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('video_frame', { frame: base64Frame, model });
    }
  }, []);

  // Start training session
  const startSession = useCallback((scenarioId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('start_session', { scenarioId });
    }
  }, []);

  // Pause training session
  const pauseSession = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('pause_session');
    }
  }, []);

  // Reset training session
  const resetSession = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('reset_session');
    }
  }, []);

  // Update AI settings
  const updateSettings = useCallback((settings: { sensitivity: number }) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('update_settings', settings);
    }
  }, []);

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
    socket: socketRef.current,
  };
};
