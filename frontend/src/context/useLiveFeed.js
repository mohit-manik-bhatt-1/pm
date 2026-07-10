import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../api/client';

export function useLiveFeed() {
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const wsUrl = API_BASE.replace('http', 'ws') + '/ws/live';
    let socket;
    let retryTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        retryTimeout = setTimeout(connect, 3000); // auto-reconnect
      };
      socket.onerror = () => socket.close();
      socket.onmessage = (event) => {
        try {
          setLastMessage(JSON.parse(event.data));
        } catch {
          // ignore malformed frames
        }
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      socket?.close();
    };
  }, []);

  return { lastMessage, connected };
}
