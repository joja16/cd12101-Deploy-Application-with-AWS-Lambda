import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

// URL to download certificate for verifying JWT token signature
const jwksUrl = 'https://dev-5nt6w0ey6lpbkn4c.us.auth0.com/.well-known/jwks.json'

export const handler = async (event) => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })

  const res = await Axios.get(jwksUrl);
  const keys = res.data.keys;
  const signKeys = keys.find(key => key.kid === jwt.header.kid);

  if(!signKeys) throw new Error("Incorrect Keys");
  const pemData = signKeys.x5c[0];
  const secret = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----\n`;

  const verifiedToken = jsonwebtoken.verify(token, secret, {algorithms: ['RS256']});

  logger.info('Verified token', verifiedToken);
  return verifiedToken;
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}