import { useRef, useCallback, useEffect } from 'react';

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState < 2) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.DEV ? 'localhost:3001' : window.location.host;
    ws.current = new WebSocket(`${protocol}//${host}`);

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        onMessageRef.current(msg);
      } catch (_) {}
    };

    ws.current.onerror = () => {
      onMessageRef.current({ type: 'error', message: 'WebSocket connection failed. Is the backend running?' });
    };

    return ws.current;
  }, []);

  const send = useCallback((data) => {
    const sock = connect();
    const doSend = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(data));
      }
    };
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      doSend();
    } else {
      ws.current.addEventListener('open', doSend, { once: true });
    }
  }, [connect]);

  const stop = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'stop' }));
    }
  }, []);

  useEffect(() => () => {
    if (ws.current) ws.current.close();
  }, []);

  return { send, stop };
}
