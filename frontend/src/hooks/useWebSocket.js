import { useRef, useCallback, useEffect } from 'react';
import { getWsUrl } from '../utils/api';

let globalWs = null;
let wsRetries = 0;
const MAX_RETRIES = 3;
const handlers = new Set();

export function useWebSocket(onMessage) {
  const onMsgRef = useRef(onMessage);
  onMsgRef.current = onMessage;

  const ensureConnection = useCallback(() => {
    if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
      return globalWs;
    }

    globalWs = new WebSocket(getWsUrl());
    wsRetries = 0;

    globalWs.onopen = () => {
      wsRetries = 0;
    };

    globalWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Call all registered handlers
        handlers.forEach(handler => {
          try {
            handler(msg);
          } catch (err) {
            console.error('Handler error:', err);
          }
        });
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    globalWs.onerror = () => {
      if (wsRetries < MAX_RETRIES) {
        wsRetries++;
        setTimeout(() => ensureConnection(), 1000 * wsRetries);
      }
    };

    globalWs.onclose = () => {
      globalWs = null;
    };

    return globalWs;
  }, []);

  const send = useCallback((data) => {
    const sock = ensureConnection();
    const doSend = () => {
      if (sock?.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify(data));
      }
    };
    if (sock?.readyState === WebSocket.OPEN) {
      doSend();
    } else if (sock) {
      sock.addEventListener('open', doSend, { once: true });
    }
  }, [ensureConnection]);

  const stop = useCallback(() => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'stop' }));
    }
  }, []);

  useEffect(() => {
    ensureConnection();
    // Register this handler
    const handler = (msg) => onMsgRef.current?.(msg);
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }, [ensureConnection]);

  return { send, stop };
}
