import websockets
import asyncio
import json
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)

class ESP32DeviceSimulator:
    def __init__(self, websocket_uri, machine_id):
        self.uri = websocket_uri
        self.machine_id = machine_id
        self.lock_state = True  # Start in locked state as per ESP32 code
        self.connected = False
        self.logger = logging.getLogger("ESP32_SIMULATOR")

    async def send_message(self, websocket, message):
        """Send a message and log it"""
        if 'type' in message and message['type'] != 'heartbeat':
            # Add machineId to all non-heartbeat messages
            message['machineId'] = self.machine_id
        await websocket.send(json.dumps(message))
        self.logger.info(f"Sent: {json.dumps(message)}")
    
    async def handle_connection_closed(self):
        """Handle connection closure"""
        self.connected = False
        self.logger.info("Connection closed, status set to offline")
        # Note: The server will handle setting the status to offline
    
    async def send_heartbeat(self, websocket):
        """Replicate the ESP32's heartbeat task"""
        while self.connected:
            try:
                await self.send_message(websocket, {
                    "type": "heartbeat",
                    "machineId": self.machine_id  # Include machineId in heartbeat too
                })
                await asyncio.sleep(30)  # 30 seconds as per ESP32 code
            except Exception as e:
                self.logger.error(f"Heartbeat error: {str(e)}")
                break

    async def send_status_update(self, websocket):
        """Replicate the ESP32's status update function"""
        await self.send_message(websocket, {
            "type": "status_update",
            "machineId": self.machine_id,  # Include machineId
            "status": "locked" if self.lock_state else "unlocked"
        })

    async def control_lock(self, websocket, lock):
        """Replicate the ESP32's lock control function"""
        self.lock_state = lock
        self.logger.info(f"Lock state changed to: {'locked' if lock else 'unlocked'}")
        await self.send_status_update(websocket)

    async def handle_message(self, websocket, message):
        """Handle incoming messages like the ESP32's websocket_event_handler"""
        try:
            data = json.loads(message)
            self.logger.info(f"Received: {data}")

            if data.get("type") == "command":
                command = data.get("command")
                if command == "lock":
                    await self.control_lock(websocket, True)
                elif command == "unlock":
                    await self.control_lock(websocket, False)

        except json.JSONDecodeError:
            self.logger.error(f"Failed to parse message: {message}")
        except Exception as e:
            self.logger.error(f"Error handling message: {str(e)}")

    async def connect(self):
        """Main connection function"""
        while True:
            try:
                async with websockets.connect(self.uri) as websocket:
                    self.logger.info(f"Connected to {self.uri}")
                    self.connected = True

                    # Send registration message with role and machineId
                    await self.send_message(websocket, {
                        "type": "register",
                        "role": "machine",  # Identify as a machine
                        "machineId": self.machine_id,
                        "status": "locked"  # Always start in locked state
                    })
                    self.logger.info(f"Registration sent for machine ID: {self.machine_id}")

                    # Start heartbeat task
                    heartbeat_task = asyncio.create_task(self.send_heartbeat(websocket))

                    try:
                        async for message in websocket:
                            await self.handle_message(websocket, message)
                    except websockets.exceptions.ConnectionClosed:
                        await self.handle_connection_closed()
                    finally:
                        heartbeat_task.cancel()
                        
            except Exception as e:
                self.logger.error(f"Connection error: {str(e)}")
                await self.handle_connection_closed()
            
            # Reconnection delay
            self.logger.info("Attempting to reconnect in 10 seconds...")
            await asyncio.sleep(10)

async def main():
    # Configuration (same as ESP32 defines)
    # IP address subject to change depending on which n/w we are connected to
    WS_URI = "ws://192.168.43.243:4000"   # IP address changes, depends on LAN
    MACHINE_ID = "67680b7a26568d040e6b24e1"     # Machine ID for school

    simulator = ESP32DeviceSimulator(WS_URI, MACHINE_ID)
    await simulator.connect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSimulator stopped by user")
