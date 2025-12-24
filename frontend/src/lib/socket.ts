// eslint-disable-next-line @typescript-eslint/no-require-imports
const socketIO = require('socket.io-client');
const io = socketIO.io || socketIO.default || socketIO;

// Socket.IO client configuration - connects to NestJS backend
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
  autoConnect: false, // Don't auto-connect, wait for user authentication
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to notification server');
});

socket.on('disconnect', (reason: string) => {
  console.log('❌ Disconnected from notification server:', reason);
});

socket.on('connect_error', (error: Error) => {
  // Only log in development mode and if we actually tried to connect
  if (process.env.NODE_ENV === 'development') {
    // Check if user is authenticated before logging error
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      console.warn('⚠️ Socket connection error:', error.message);
    }
  }
  // Silently fail for unauthenticated users
});

socket.on('connected', (data: unknown) => {
  console.log('📡 Server welcome:', data);
});

export default socket;