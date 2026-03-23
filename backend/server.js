const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

app.use("/", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const roomName = (excursionId) => `excursion:${String(excursionId)}`;

io.on("connection", (socket) => {
  socket.on("joinExcursion", ({ excursionId }) => {
    if (!excursionId) return;

    socket.join(roomName(excursionId));
  });

  socket.on("leaveExcursion", ({ excursionId }) => {
    if (!excursionId) return;

    socket.leave(roomName(excursionId));
  });
});

app.set("io", io);
app.set("roomName", roomName);

server.listen(5000, () => console.log("API running on 5000"));
