import { createClient } from 'redis';
// import { getConfig } from '../config';

export const redisClient = createClient();
// const config = getConfig();
// export const redisClient = createClient({
//     host: config.REDIS_HOST,
//     port: Number(config.REDIS_PORT),
//     password: config.REDIS_PASSWORD
// });

redisClient
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

export const initRedis = () => {
    redisClient.set('total_users', 0);
    redisClient.set('room:0:name', 'General');
};
