import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import RedisStore from "connect-redis";
import session from 'express-session';
import { createClient } from "redis";

const app: Application = express();
const server = createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const redisClient = createClient()
redisClient.connect().then(() => {
  console.log('CONNECTED TO REDIS SERVER');
}).catch(console.error)

const sessionStore = new RedisStore({ client: redisClient })

app.use(session({
  secret: "explodingcats",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
}));

app.get('/', (_, res) => {
  res.status(200).send('<h1>Ok</h1>');
});

io.on('connection', (socket) => {
  console.log('New client connected');
})

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
