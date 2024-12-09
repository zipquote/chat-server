import { Request, Response } from 'express';
import {
  createUser,
  findUserByUsername 
} from '../services/userService';
import bcrypt from 'bcryptjs';
import { redisClient } from '../utils/redisUtils';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);

  if (!user) {
    const newUser = await createUser(username, password);
    //@ts-ignore
    req.session.user = { id: newUser.id, username: newUser.username  };
    req.session.save();
    return res.status(200).json(newUser);
  }

  //@ts-ignore
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (isPasswordValid) {
    //@ts-ignore
    req.session.user = { id: user.id, username: user.username };
    req.session.save();
    return res.status(200).json(user);
  }

  return res.status(404).json({ message: 'Invalid username or password' });
};

export const logout = (req: Request, res: Response) => {
  //@ts-ignore
  req.session.user = null;
  req.session.save();
  return res.status(200).json(null);
};

export const getMe = (req: Request, res: Response) => {
  //@ts-ignore
  const user = req.session.user;
  // console.log('USER : ', user, req.session, req.session.id);
  if (!user) return res.status(400).json(null);
  return res.json({ id: user.id, username: user.username });
};

export const getUserInfoFromIds = async (req: Request, res: Response) => {
    const ids = req.query.ids; // Get the ids from the query parameter

    if (ids && Array.isArray(ids)) {
        const users = {};
        for (const id of ids) {
            const user = await redisClient.hGetAll(`user:${id}`);
            const isMember = await redisClient.sIsMember('online_users', id.toString());
          //@ts-ignore  
          users[id] = {
                id: id,
                username: user.username || null, // Handle case where username might be undefined
                online: Boolean(isMember),
            };
        }
        return res.json(users);
    }

    return res.status(404).json(null);
};

export const getOnlineUsers = async (req: Request, res: Response) => {
  const onlineIds = await redisClient.sMembers('online_users');
  const users: { [key: string]: any } = {};

  onlineIds.forEach(async (id: string) => {
    console.log('IDS : ', id);
    const user = await redisClient.hGetAll(`user:${id}`);
    console.log('USER : ', user);
    users[id] = {
      id,
      username: user['username'],
      online: true,
    };
  });
  console.log('USERS : ', users);
  return res.status(200).json(users);
};
