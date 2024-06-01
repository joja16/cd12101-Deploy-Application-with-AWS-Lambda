import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createLogger } from "../utils/logger.mjs";

const logger = createLogger("TodoAccess");
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;
const s3BucketName = process.env.ATTACHMENT_S3_BUCKET;

export class TodosAccess {
  constructor() {
    this.client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(this.client);
    this.todosTable = process.env.TODOS_TABLE;
    this.todosIndex = process.env.TODOS_CREATED_AT_INDEX;
    this.s3Client = new S3Client({});
    this.bucketName = s3BucketName;
  }

  async getAll(userId) {
    logger.info("Call function getAll");
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    }));
    return result.Items;
  }

  async create(item) {
    logger.info("Call function create");
    await this.docClient.send(new PutCommand({
      TableName: this.todosTable,
      Item: item,
    }));
    return item;
  }

  async update(userId, todoId, todoUpdate) {
    logger.info(`Updating todo item ${todoId} in ${this.todosTable}`);
    try {
      await this.docClient.send(new UpdateCommand({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId,
        },
        UpdateExpression: "set #name = :name, #dueDate = :dueDate, #done = :done",
        ExpressionAttributeNames: {
          "#name": "name",
          "#dueDate": "dueDate",
          "#done": "done",
        },
        ExpressionAttributeValues: {
          ":name": todoUpdate.name,
          ":dueDate": todoUpdate.dueDate,
          ":done": todoUpdate.done,
        },
        ReturnValues: "UPDATED_NEW",
      }));
    } catch (error) {
      logger.error("Error updating Todo.", {
        error: error.message,
        data: {
          todoId,
          userId,
          todoUpdate,
        },
      });
      throw new Error(error.message);
    }
    return todoUpdate;
  }

  async delete(userId, todoId) {
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`);
    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId,
        },
      }));
      return "success";
    } catch (e) {
      logger.error("Error deleting Todo.", {
        error: e.message,
      });
      return "Error";
    }
  }

  async getUploadUrl(todoId, userId) {
    const uploadUrl = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucketName,
      Key: todoId,
      Expires: Number(urlExpiration),
    }));
    await this.docClient.send(new UpdateCommand({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId,
      },
      UpdateExpression: "set attachmentUrl = :URL",
      ExpressionAttributeValues: {
        ":URL": uploadUrl.split("?")[0],
      },
      ReturnValues: "UPDATED_NEW",
    }));
    return uploadUrl;
  }
}
