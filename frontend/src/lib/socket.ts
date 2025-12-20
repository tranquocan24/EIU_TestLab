import { io } from 'socket.io-client';

// Socket.IO client configuration
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
  autoConnect: false, // Don't auto-connect, wait for user authentication
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 2000,
  timeout: 10000,
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to notification server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from notification server');
});

socket.on('connect_error', (error) => {
  // Only log in development mode and if user is authenticated
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('token')) {
    console.warn('⚠️ Notification server unavailable (this is normal if WebSocket server is not running)');
  }
  // Silently fail - don't show errors to user
});

export default socket;