import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
  // Strip trailing /api to connect directly to the root socket server
  return apiUrl.replace(/\/api$/, '');
};

const SOCKET_SERVER_URL = getSocketUrl();

export const useSocketConnection = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return socket;
};
