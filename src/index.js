import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { createServer } from 'http';
import app from './app.js';
import { Server } from 'socket.io';

dotenv.config();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`${userId} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is up and running ✅");
});

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
  });

  export { io }
