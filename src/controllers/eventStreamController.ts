import { Request, Response } from 'express';
import { redisClient } from '../utils/redisUtils';
import { SERVER_ID } from '../server';

export const eventStreamHandler = async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Subscribe to the Redis channel
    const subscriber = redisClient.duplicate();
    subscriber.on('error', (err) => {
      console.error('Error: %s', err.message);
      res.end();
    }).connect();
    await subscriber.subscribe('MESSAGES', (channel, message) => {
        const parsedMessage = JSON.parse(message);

        // Ignore messages from this server
        if (parsedMessage.serverId === SERVER_ID) {
            return;
        }

        const data = `data: ${JSON.stringify({
            type: parsedMessage.type,
            data: parsedMessage.data,
        })}\n\n`;

        res.write(data);
    });

    // Cleanup on connection close
    req.on('close', () => {
        subscriber.unsubscribe();
        subscriber.quit();
        res.end();
    });
  } catch (error) {
    console.log('ERROR EVENT HANDLER')
  }
};
