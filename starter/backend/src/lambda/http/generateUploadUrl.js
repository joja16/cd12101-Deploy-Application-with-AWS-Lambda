import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';

import { createAttachmentPresignedUrl } from '../../businessLogic/todos.mjs';
import { getUserId } from '../utils.mjs';

export const handler = middy(async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      },
    };
  }

  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId;
  const url = await createAttachmentPresignedUrl(userId, todoId);
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({ uploadUrl: url }),
  };
})
.use(httpErrorHandler())
.use(cors({ credentials: true }));
