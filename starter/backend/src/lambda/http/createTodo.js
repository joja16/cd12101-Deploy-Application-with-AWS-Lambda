import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { createTodo } from '../../businessLogic/todos.mjs';
import { getUserId } from '../utils.mjs';

const createTodoHandler = async (event) => {
  const newTodo = JSON.parse(event.body);
  const userId = getUserId(event);

  try {
    const newItem = await createTodo(newTodo, userId);
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newItem,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ Error: error }),
    };
  }
};

export const handler = middy(createTodoHandler)
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));
