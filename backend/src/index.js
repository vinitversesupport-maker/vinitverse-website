const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST'] }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes(io));
app.use('/api/matches', matchRoutes(io));
app.use('/api/chat', chatRoutes(io));

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('join_tournament', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
  });
  socket.on('leave_tournament', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
