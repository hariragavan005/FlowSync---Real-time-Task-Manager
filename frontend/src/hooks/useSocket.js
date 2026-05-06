import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocketConnection = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return socket;
};
