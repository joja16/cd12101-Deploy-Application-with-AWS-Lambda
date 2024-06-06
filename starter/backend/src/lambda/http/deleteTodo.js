import middy from '@middy/core';
import cors from '@middy/http-cors';
import { deleteTodo } from '../../businessLogic/todos.mjs'; 
import { getUserId } from '../utils.mjs';
import httpErrorHandler from '@middy/http-error-handler';

export const handler = middy(async (event) => {
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  try {
    await deleteTodo(userId, todoId);
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      statusCode: 204,
      body: '',
    };
  } catch (err) {
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      statusCode: 500,
      body: JSON.stringify({ Error: err }),
    };
  }
})
.use(httpErrorHandler())
.use(cors({
  credentials: true
}));