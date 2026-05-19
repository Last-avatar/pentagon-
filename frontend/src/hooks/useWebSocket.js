import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSocket(url) {
  const [status, setStatus] = useState("connecting");
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    setStatus("connecting");
    if (ws.current) {
      ws.current.close();
    }

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setStatus("open");
        console.log("WebSocket connected to Telemetry Bus.");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
        } catch (err) {
          console.error("Failed to parse WebSocket frame:", err);
        }
      };

      socket.onclose = () => {
        setStatus("closed");
        console.log("WebSocket connection lost. Retrying in 3 seconds...");
        // Reconnect loop
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket socket error:", err);
        socket.close();
      };

      ws.current = socket;
    } catch (e) {
      console.error("WebSocket initialization error:", e);
      setStatus("closed");
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(typeof msg === "string" ? msg : JSON.stringify(msg));
    } else {
      console.warn("Unable to send message, WebSocket is not open.");
    }
  }, []);

  return { status, lastMessage, sendMessage };
}
