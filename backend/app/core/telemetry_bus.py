import asyncio
import time
from typing import List, Callable, Any

class TelemetryBus:
    def __init__(self):
        # Subscribers are callable handlers, taking event_type: str and message_dict: dict
        self.subscribers: List[Callable[[dict], Any]] = []

    def subscribe(self, callback: Callable[[dict], Any]):
        if callback not in self.subscribers:
            self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[dict], Any]):
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    async def emit(self, event_type: str, data: Any):
        """
        Broadcasting an event to all websocket subscribers.
        """
        payload = {
            "timestamp": time.time(),
            "event_type": event_type,
            "data": data
        }
        
        # Call all subscribers asynchronously
        for callback in list(self.subscribers):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(payload)
                else:
                    callback(payload)
            except Exception:
                # Silently handle failed or dead subscriber callbacks
                pass

telemetry_bus = TelemetryBus()
