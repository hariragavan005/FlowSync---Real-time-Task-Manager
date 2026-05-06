import React, { createContext, useContext } from 'react';
import { useSocketConnection } from '../hooks/useSocket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socket = useSocketConnection();

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
