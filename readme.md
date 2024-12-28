# 🔐 Remote Controlled Lock System
## WebSocket-based Machine Control using ESP32

A real-time management and monitoring of remote-controlled locks using WebSocket technology. Whether you want to lock, unlock, or just keep an eye on your machines.

## ✨ Key Features

**Real-Time Control & Monitoring**
- Instant command transmission to connected machines
- Live status updates from all connected devices
- Continuous heartbeat monitoring for reliable connection status

**Secure & Scalable**
- Local network deployment for enhanced security
- Support for multiple concurrent device connections
- MongoDB-based persistent storage for device management

## 🚀 Getting Started

### Prerequisites
- Node.js and npm installed
- Python 3.x
- MongoDB running locally
- ESP32 development environment (optional for hardware implementation)

### Network Setup
1. Create a Local Area Network (LAN):
   - Enable hotspot on any device
   - Connect all target devices to this network

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/saqib40/miniproject2
```

2. Launch the Backend:
```bash
cd miniproject2/backend
npm install
npm run dev
```

3. Start the Frontend:
```bash
cd miniproject2/frontend
npm install
npm start
```

4. Get your host machine's IP address:
- For Linux/Unix systems:
```bash
ipconfig getifaddr en0
```

### Device Configuration

1. Set up test devices:
- Navigate to the `test` directory
- Share `test.py` with each device in your LAN
- Configure each device:
  - Update `WS_URI` with your host IP address
  - Set unique `MACHINE_ID` for each device (create via frontend)

2. Install Python dependencies and run:
```bash
pip install websockets
python test.py
```

## 🧪 Testing

1. Access the frontend interface
2. Create new machine entries
3. Test lock/unlock commands
4. Monitor real-time status updates

## 📚 Resources

- [ESP-IDF Documentation](https://github.com/espressif/esp-idf)
- [WebSocket Protocol](https://www.youtube.com/playlist?list=PLYxzS__5yYQnRizvwNYWwzFjd9J4ni_Ga)

## 👥 Contributors

- **Saqib Hussain Dar**
- **Rohit Y Patil**


Made with ❤️ for secure, real-time machine control