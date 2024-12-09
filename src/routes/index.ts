import { Application } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  login,
  logout, 
  getMe,
  getOnlineUsers,
  getUserInfoFromIds
} from '../controllers/userController';
import { eventStreamHandler } from '../controllers/eventStreamController';
import { getMessagesForRoom, getRoomsForUserId } from '../controllers/roomController';

export const initRoutes = (app: Application) => {
  //@ts-ignore
  app.get('/me', getMe);
  //@ts-ignore
  app.post('/login', login);
  //@ts-ignore
  app.post('/logout', authMiddleware, logout);
  //@ts-ignore
  app.post('/users', authMiddleware, getUserInfoFromIds);
  //@ts-ignore
  app.get('/users/online', authMiddleware, getOnlineUsers);
  // @ts-ignore
  app.get('/rooms/:userId', authMiddleware, getRoomsForUserId);
  // @ts-ignore
  app.get('/room/:roomId/messages', authMiddleware, getMessagesForRoom);
  //@ts-ignore
  app.get('/stream', authMiddleware, eventStreamHandler);
};
