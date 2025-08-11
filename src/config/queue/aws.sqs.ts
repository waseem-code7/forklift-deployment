export const QUEUE_CONFIG = {
    "QueueUrl": process.env.AWS_SQS_URL,
    AttributeNames: [
        "All"
    ],
    MessageSystemAttributeNames: [
        "All"
    ],
    MessageAttributeNames: ["type"],
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 5,
    WaitTimeSeconds: 10
}