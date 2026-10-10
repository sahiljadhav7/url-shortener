# Serverless URL Shortener Resources

## Knowledge

- [AWS SAM: HttpApi event](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-httpapi.html)
  How a function's `HttpApi` event creates routes, and the implicit `ServerlessHttpApi`. Use for: adding routes, payload format version.
- [AWS SAM policy template list](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-template-list.html)
  The exact IAM actions behind `DynamoDBReadPolicy`, `DynamoDBWritePolicy`, `DynamoDBCrudPolicy`, etc. Use for: least-privilege `Policies`.
- [DynamoDB API Reference: UpdateItem](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html)
  `ADD`, `SET`, `ReturnValues`, condition expressions. Use for: the atomic counter (Step 3) and custom aliases (Phase 2).
- [MDN: 302 Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/302) · [MDN: 410 Gone](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/410) · [MDN: Redirections in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Redirections)
  Use for: redirect status codes and the `Location` header.
- [RFC 9110 §15.4: Redirection 3xx](https://www.rfc-editor.org/rfc/rfc9110#section-15.4)
  The HTTP spec itself; 301 is "heuristically cacheable". Use for: settling 301 vs 302 caching questions.

## Wisdom (Communities)

- Not yet searched. Candidates to vet: r/aws, AWS re:Post.

## Gaps

- A good primary source on DynamoDB hot partitions (for the DESIGN.md §7 counter question).
- Lambda payload format 2.0 event-shape reference for HTTP API.
