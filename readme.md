#  MiniProject2 - Remote Controlled Lock System Using WebSockets and ESP32
Welcome to the **Mini-Project2**!
This project is for managing, monitoring, and controlling machines over WebSockets. Whether you want to lock, unlock, or just keep an eye on your machines.

##  Features
- **Real-Time Control:** Send commands to your machines in real-time. 
- **Status Updates:** Get instant updates on the status of your machines. 
- **Heartbeat Monitoring:** Ensure your machines are alive and kicking!

## Installation

To make this project work

- **Create a LAN (Local Area Network):** 
Can be created easily by turning on the hotspot on any machine, and connect as many machines as you want.

- **Clone this project:** 
Clone and get your backend and frontend running, make sure you have MongoDB running.
```bash
  git clone saqib40/miniproject2
```
For backend
```bash
  cd miniproject2/backend
  npm install
  npm run dev
```
For frontend
```bash
  cd miniproject2/frontend
  npm install
  npm start
```
On the device where you cloned the project you gotta retrieve it's IP address (for linux/unix system)
```bash
  ipconfig getifaddr en0
```

- **Share the python file:**
From the *test* directory share the *test.py* with as many devices as you have kept in the LAN, you gotta change the *WS_URI* according to your IP address and *MACHINE_ID* after creating a bunch of machines(can be done easily frontend and MACHINE_IDs from the database), to simulate them. To get python files working
```bash
  pip install websockets
  python test.py
```

- **Now Test:**
Now you can easily test the locking/unlocking of any lock by interacting with the frontend.

## Acknowledgements
- [ESP -IDF](https://github.com/espressif/esp-idf)

## Authors
- Saqib Hussain Dar
- Rohit Y Patil