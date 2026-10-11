import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import Hashids from "hashids";
const hashids = new Hashids(process.env.HASH_SALT, 7);

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const lambdaHandler = async (event, context) => {
  let body;
  try {
    body = JSON.parse(event.body);
    if (!body.longUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "longUrl is required",
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid request body",
      }),
    };
  }
  let result;

  try {
    const counterParams = {
      TableName: process.env.COUNTER_TABLE_NAME,
      Key: {
        id: "global",
      },

      UpdateExpression: "ADD #counter :incr",

      ExpressionAttributeNames: {
        "#counter": "value",
      },
      ExpressionAttributeValues: {
        ":incr": 1,
      },
      ReturnValues: "UPDATED_NEW",
    };

    result = await docClient.send(new UpdateCommand(counterParams));
    console.log("Counter updated:", result.Attributes.value);
  } catch (err) {
    console.error("Error updating counter:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating counter",
      }),
    };
  }

  const linkParams = {
    TableName: process.env.LINKS_TABLE_NAME,
    Item: {
      code: hashids.encode(result.Attributes.value),
      longUrl: body.longUrl,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(linkParams));
  } catch (err) {
    console.error("Error creating short URL:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating short URL",
      }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "short url created",
      shortUrl:
        "https://" +
        event.requestContext.domainName +
        "/" +
        linkParams.Item.code,
    }),
  };
};
