import AWS from "aws-sdk";
import AWSXRay from "aws-xray-sdk";
import { createLogger } from "../utils/logger.mjs";

const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger("TodosAccess");
const url_expiration = process.env.AWS_S3_SIGNED_URL_EXPIRATION;
const s3_bucket_name = process.env.AWS_BUCKET;

export class TodosAccess {
  constructor(
    docClient = createDynamoDBClient(),
    todosTable = process.env.AWS_DB_APP_TABLE,
    todosIndex = process.env.AWS_DB_INDEX_NAME,
    S3 = new XAWS.S3({ signatureVersion: "v4" }),
    bucket_name = s3_bucket_name
  ) {
    this.docClient = docClient;
    this.todosTable = todosTable;
    this.todosIndex = todosIndex;
    this.S3 = S3;
    this.bucket_name = bucket_name;
  }

  async getAll(userId) {
    logger.info("Call function getAll");
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosIndex,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
      .promise();
    return result.Items;
  }

  async create(item) {
    logger.info("Call function create");
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: item,
      })
      .promise();
    return item;
  }

  async update(userId, todoId, todoUpdate) {
    logger.info(`Updating todo item ${todoId} in ${this.todosTable}`);
    try {
      await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            userId,
            todoId,
          },
          UpdateExpression:
            "set #name = :name, #dueDate = :dueDate, #done = :done",
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
        })
        .promise();
    } catch (error) {
      logger.error("Error updating Todo.", {
        error: error,
        data: {
          todoId,
          userId,
          todoUpdate,
        },
      });
      throw Error(error);
    }
    return todoUpdate;
  }

  async delete(userId, todoId) {
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`);
    try {
      await this.docClient
        .delete({
          TableName: this.todosTable,
          Key: {
            userId,
            todoId,
          },
        })
        .promise();
      return "success";
    } catch (e) {
      logger.info("Error deleting Todo", { error: e });
      return "Error";
    }
  }

  async getUploadUrl(todoId, userId) {
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.bucket_name,
      Key: todoId,
      Expires: parseInt(this.url_expiration) 
    });
  
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        UpdateExpression: "set attachmentUrl = :URL",
        ExpressionAttributeValues: { ":URL": uploadUrl.split("?")[0] }, 
        ReturnValues: "UPDATED_NEW",
      })
      .promise();
  
    return uploadUrl;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log("Creating a local DynamoDB instance");
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
