import {DynamoDBClient} from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient, UpdateCommand} from '@aws-sdk/lib-dynamodb'

const baseClient = new DynamoDBClient({region: process.env.AWS_REGION})
const ddbDocClient = DynamoDBDocumentClient.from(baseClient)

export const lambdaHandler = async (event, context) => {
     let body;
     try{
        body = JSON.parse(event.body);
        if(!body.longUrl){
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'longUrl is required'
                })
            }
        }

        
     }
     catch(err){
         return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'invalid request body'
            })
         }

     }

     return {
          statusCode: 201,
          body: JSON.stringify({
            message: 'short url created',
            shortUrl: 'https://short.url/abc123'
          })
        }
  };
