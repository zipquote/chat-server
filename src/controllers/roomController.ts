import { hmget } from "../utils";
import { redisClient } from "../utils/redisUtils";

async function getMessages(roomId = 0, offset = 0, size = 50) {
    const roomKey = `room:${roomId}`;
    const roomExists = await redisClient.exists(roomKey);
    if (!roomExists) {
        return [];
    } else {
      const values = await redisClient.zRange(roomKey, offset, offset + size - 1);
      //@ts-ignore
      return values.map(value => JSON.parse(value));
    }
}

export const getMessagesForRoom = async (req: Request, res: Response) => {
  //@ts-ignore
  const roomId = req.params.roomId;
  //@ts-ignore
  const offset = parseInt(req.query.offset, 10) || 0; // Default to 0 if not provided
  //@ts-ignore
  const size = parseInt(req.query.size, 10) || 50; // Default to 50 if not provided

  try {
      const messages = await getMessages(roomId, offset, size);
    //@ts-ignore  
    return res.json(messages);
  } catch (error) {
    console.error(error);
    //@ts-ignore
      return res.status(400).json(null); // Send 400 for bad requests
  }
}

export const getRoomsForUserId = async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.params.userId;

  try {
    // Get room IDs for the user
    const roomIdsRaw = await redisClient.sMembers(`user:${userId}:rooms`);
    //@ts-ignore  
    const roomIds = roomIdsRaw.map(id => id.toString('utf-8')); // Decode buffer to string

    const rooms = [];

    for (const roomId of roomIds) {
        const nameBuffer = await redisClient.get(`room:${roomId}:name`);

        // It's a room without a name, likely one with private messages
        if (!nameBuffer) {
            const roomExists = await redisClient.exists(`room:${roomId}`);
            if (!roomExists) continue; // Skip non-existing rooms

            const userIds = roomId.split(":");
          if (userIds.length !== 2) {
                //@ts-ignore
                return res.status(400).json(null);
            }

            rooms.push({
                id: roomId,
                names: [
                    await hmget(`user:${userIds[0]}`, 'username'),
                    await hmget(`user:${userIds[1]}`, 'username'),
                ],
            });
        } else {
            //@ts-ignore
            rooms.push({ id: roomId, names: [nameBuffer.toString('utf-8')] });
        }
    }
  //@ts-ignore
    return res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
      //@ts-ignore
      return res.status(500).json({ error: 'Internal Server Error' });
  }
}
