import { redisClient } from '../utils/redisUtils';
import bcrypt from 'bcryptjs';

export const createUser = async (username: string, password: string) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = await redisClient.incr('total_users');
    //TODO: Generate a unique user ID random string
    const userKey = `user:${userId}`;

    await redisClient.set(`username:${username}`, userKey);
    await redisClient.hSet(userKey, { username, password: hashedPassword });

    return { id: userId, username };
};

export const findUserByUsername = async (username: string) => {
  const userKey = await redisClient.get(`username:${username}`);
  if (!userKey) return null;

  const user = await redisClient.hGetAll(userKey);
  return { id: userKey.split(':')[1], ...user };
};
