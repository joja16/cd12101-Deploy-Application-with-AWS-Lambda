import middy from "@middy/core";
import cors from "@middy/http-cors";
import { deleteTodo } from "../../businessLogic/todos.mjs"; 
import { getUserId } from "../utils.mjs";

export const handler = middy(async (event) => {
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);

  try {
    await deleteTodo(userId, todoId);
    return {
      statusCode: 204,
      body: "",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ Error: err }),
    };
  }
})
.use(httpErrorHandler())
.use(cors({
  credentials: true
}));