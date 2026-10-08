from fastapi import WebSocket
from typing import Dict, List
from datetime import datetime, timezone

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            'admin': [],
            'rescue': [],
            'citizen': []
        }

    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        if client_type in self.active_connections:
            self.active_connections[client_type].append(websocket)
        else:
            self.active_connections[client_type] = [websocket]

    def disconnect(self, websocket: WebSocket, client_type: str):
        if client_type in self.active_connections and websocket in self.active_connections[client_type]:
            self.active_connections[client_type].remove(websocket)

    async def send_personal(self, message: dict, websocket: WebSocket):
        message['timestamp'] = datetime.now(timezone.utc).isoformat()
        await websocket.send_json(message)

    async def broadcast_to_role(self, message: dict, role: str):
        message['timestamp'] = datetime.now(timezone.utc).isoformat()
        if role in self.active_connections:
            for connection in self.active_connections[role]:
                await connection.send_json(message)

    async def broadcast_all(self, message: dict):
        message['timestamp'] = datetime.now(timezone.utc).isoformat()
        for role, connections in self.active_connections.items():
            for connection in connections:
                await connection.send_json(message)

manager = ConnectionManager()
