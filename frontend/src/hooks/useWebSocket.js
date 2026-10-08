import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';

export function useWebSocket(clientType) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    wsService.connect(clientType);
    
    const unsubsStatus = wsService.onStatusChange((status) => {
        setConnected(status === 'connected');
    });

    const unsubscribe = wsService.onMessage((msg) => {
      setLastMessage(msg);
    });

    return () => {
      unsubscribe();
      unsubsStatus();
      wsService.disconnect();
    };
  }, [clientType]);

  const sendMessage = (data) => {
    wsService.send(data);
  };

  return { connected, lastMessage, sendMessage };
}
