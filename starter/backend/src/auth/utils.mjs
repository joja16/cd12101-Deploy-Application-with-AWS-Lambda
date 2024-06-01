import { decode } from 'jsonwebtoken';
import { createLogger } from '../utils/logger.mjs';

const logger = createLogger('utils');

export function parseUserId(jwtToken) {
  try {
    const decodedJwt = decode(jwtToken);
    if (!decodedJwt) {
      logger.error('Failed to decode JWT token');
      throw new Error('Invalid token');
    }
    return decodedJwt.sub;
  } catch (error) {
    logger.error('Error parsing JWT token:', error);
    throw new Error('Failed to parse JWT token');
  }
}
