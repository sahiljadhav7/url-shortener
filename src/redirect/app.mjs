import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const RedirectHandler = async (event, context) => {
  let shortUrl;
  try {
    shortUrl = event.pathParameters.code;
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "shortUrl is required",
      }),
    };
  }

  let result;
  try {
    const getParams = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        code: shortUrl,
      },
    };

    result = await docClient.send(new GetCommand(getParams));
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Short URL not found",
        }),
      };
    }
  } catch (err) {
    console.error("Error retrieving URL:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving URL",
      }),
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: result.Item.longUrl,
    },
  };
};
