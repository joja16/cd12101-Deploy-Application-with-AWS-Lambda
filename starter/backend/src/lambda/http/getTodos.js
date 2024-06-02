import middy from "@middy/core";
import cors from "@middy/http-cors";
import { getTodosForUser } from "../../businessLogic/todos.mjs";
import { getUserId } from "../utils.mjs";

export const handler = middy(async (event) => {
  try {
    const userId = getUserId(event);
    const todos = await getTodosForUser(userId);
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      statusCode: 200,
      body: JSON.stringify({ items: todos }),
    };
  } catch (error) {
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      statusCode: 500,
      body: JSON.stringify({ error: error }),
    };
  }
})
.use(cors({ credentials: true }));