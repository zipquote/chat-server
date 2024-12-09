import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import RedisStore from "connect-redis";
import session from 'express-session';
import {createClient} from "redis"
import { initRoutes } from './routes';
import {
  ioConnect,
  // ioDisconnect, ioJoinRoom, ioOnMessage
} from './controllers/socketController';
import { initRedis } from './utils/redisUtils';
// import { getConfig } from './config';

export const SERVER_ID = Math.random() * 322321;

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
};

// Initialize Redis and demo data
initRedis();

const app: Application = express();
const server = createServer(app);
export const io = new SocketIOServer(server, {
  cors: corsOptions
});
// const config = getConfig();

// app.options('*', cors());
app.use(cors(corsOptions));
app.use(express.json());

const redisClient = createClient()
redisClient.connect().then(() => {
  console.log('CONNECTED TO REDIS SERVER');
}).catch(console.error)

const sessionStore = new RedisStore({ client: redisClient })
const expressSession = session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
})

app.use(expressSession);

// Initialize routes
initRoutes(app);

// Socket.IO event handlers
io.engine.use(expressSession);
// io.use(wrap(expressSession));
io.on('connection', ioConnect);
// io.on('disconnect', ioDisconnect);
// io.on('room.join', ioJoinRoom);
// io.on('message', ioOnMessage);

app.get('/healthcheck', (_, res) => {
  res.status(200).send('<h1>Ok</h1>');
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
