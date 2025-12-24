// Socket.IO hook for real-time features
import { useEffect, useRef, useState, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const socketIO = require('socket.io-client');
const io = socketIO.io || socketIO.default || socketIO;
import { useAuth } from './useAuth';
import { SocketEvents } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketType = ReturnType<typeof io>;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection - connects to NestJS backend
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      setError(err.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, isAuthenticated]);

  // Emit event
  const emit = useCallback(<K extends keyof SocketEvents>(
    event: K,
    data: SocketEvents[K]
  ) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Listen to event
  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event as string, callback);
    }
  }, []);

  // Remove event listener
  const off = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback?: (data: SocketEvents[K]) => void
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event as string, callback);
    }
  }, []);

  // Get socket instance
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    getSocket,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};