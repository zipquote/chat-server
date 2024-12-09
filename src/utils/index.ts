import { redisClient } from "./redisUtils";

// Function to get messages from a room
export async function getMessages(roomId = 0, offset = 0, size = 50) {
    const roomKey = `room:${roomId}`;
    const roomExists = await redisClient.exists(roomKey);

    if (!roomExists) {
        return [];
    } else {
        const values = await redisClient.zRange(roomKey, offset, offset + size - 1);
        return values.map(value => JSON.parse(value));
    }
}

// Function to wrap around hmget and unpack bytes
export async function hmget(key: any, key2: any) {
  const result = await redisClient.hmGet(key, key2);
  //@ts-ignore
  return result.map(value => value ? value.toString('utf-8') : null);
}

// Function to get private room ID
export function getPrivateRoomId(user1: any, user2: any) {
    if (isNaN(user1) || isNaN(user2) || user1 === user2) {
        return null;
    }
    const minUserId = Math.min(user1, user2);
    const maxUserId = Math.max(user1, user2);
    return `${minUserId}:${maxUserId}`;
}

// Function to create a private room and add users to it
export async function createPrivateRoom(user1: any, user2: any) {
    const roomId = getPrivateRoomId(user1, user2);
    if (!roomId) {
        return [null, true];
    }

    // Add room to those users
    await redisClient.sAdd(`user:${user1}:rooms`, roomId);
    await redisClient.sAdd(`user:${user2}:rooms`, roomId);

    return [
        {
            id: roomId,
            names: [
                await hmget(`user:${user1}`, 'username'),
                await hmget(`user:${user2}`, 'username'),
            ],
        },
        false,
    ];
}
