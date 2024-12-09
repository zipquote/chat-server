import { Socket } from 'socket.io';
import { redisClient } from '../utils/redisUtils';
import { io, SERVER_ID } from '../server';
import { hmget } from '../utils';
// import { publishMessage } from '../services/messageService';

const publishMessage = async (name: string, message: any, broadcast = false, room = null) => {
  if (room) {
    io.to(room).emit(name, message);
  } else {
    io.emit(name, message);
  }

  const outgoing = {
    serverId: SERVER_ID,
    type: name,
    data: message,
  };
  await redisClient.publish('MESSAGES', JSON.stringify(outgoing)).catch(console.error);
}

export const ioConnect = async (socket: Socket) => {
  //@ts-ignore
  const session = socket.request.session;
  const user = session.user;
  // console.log('SOCKET :', session, session.id, user);
  if (!user) return;

  const userId = user.id;
  socket.join(user.id);

  await redisClient.sAdd('online_users', userId.toString());
  await publishMessage('user.connected', { user, online: true }, true);
};

export const ioDisconnect = async (socket: Socket) => {
  //@ts-ignore
  const session = socket.request.session;
  const user = session.user;
  if (user) {
      await redisClient.sRem('online_users', user.id.toString());
      publishMessage('user.disconnected', { user, online: false }, true);
    }
};

// export const ioJoinRoom = (socket: Socket, roomId: string) => {
//     socket.join(roomId);
// };

export const ioOnMessage = async (socket: Socket, message: any) => {
  const cleanedMessage = escapeHtml(message.message);
  await redisClient.sAdd("online_users", message.from);

  // Create message string and determine room ID
  const messageString = JSON.stringify(message);
  const roomId = message.roomId;
  const roomKey = `room:${roomId}`;

  // Check if room is private and if it has messages
  const isPrivate = !(await redisClient.exists(`${roomKey}:name`));
  const roomHasMessages = await redisClient.exists(roomKey);

  if (isPrivate && !roomHasMessages) {
      const ids = roomId.split(":");
      const msg = {
          id: roomId,
          names: [
              await hmget(`user:${ids[0]}`, "username"),
              await hmget(`user:${ids[1]}`, "username"),
          ],
      };
      await publishMessage("show.room", msg, true); // Assuming broadcast=true means true
  }

  // Store the new message in the room
  // await redisClient.zAdd(roomKey, message.date, messageString);

  // await redisClient.zAdd(roomKey, { [messageString]: message.date });
  if (isPrivate) {
    await publishMessage('message', { ...message, message: cleanedMessage }, false, roomId);
  } else {
    await publishMessage('message', { ...message, message: cleanedMessage }, true);
  }
};

// Utility to escape HTML in messages
const escapeHtml = (unsafe: string) => {
  //@ts-ignore
    return unsafe.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
};
