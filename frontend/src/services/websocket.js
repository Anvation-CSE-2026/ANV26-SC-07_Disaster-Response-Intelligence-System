export class WebSocketService {
  constructor() {
    this.ws = null;
    this.handlers = [];
    this.status = 'disconnected'; // connecting, connected, disconnected
    this.reconnectTimeout = null;
    this.backoff = 1000;
  }

  connect(clientType) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.status = 'connecting';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Connect to backend websocket port directly, or through proxy if needed
    const url = `${protocol}//${host}:8000/ws/${clientType}`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.status = 'connected';
        this.backoff = 1000;
        this.broadcastStatus();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(data));
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.broadcastStatus();
        this.reconnect(clientType);
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        // Let onclose handle reconnection
      };
    } catch (e) {
      console.error("Failed to create websocket connection", e);
      this.reconnect(clientType);
    }
  }

  reconnect(clientType) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.backoff = Math.min(this.backoff * 1.5, 10000);
      this.connect(clientType);
    }, this.backoff);
  }

  onMessage(handler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }
  
  onStatusChange(handler) {
      if(!this.statusHandlers) this.statusHandlers = [];
      this.statusHandlers.push(handler);
      handler(this.status);
      return () => {
          this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
      }
  }

  broadcastStatus() {
      if(this.statusHandlers) {
          this.statusHandlers.forEach(handler => handler(this.status));
      }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
    this.broadcastStatus();
  }
}

export const wsService = new WebSocketService();
