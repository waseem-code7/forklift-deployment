import {DeleteMessageCommand, ReceiveMessageCommand, SQSClient} from "@aws-sdk/client-sqs"; // ES Modules import
import {MESSAGE_BODY} from "../interfaces/sqs.message";
import {safeParseJSON} from "../utils/common.utils";
import EcsTasks from "../services/ecs.tasks";
import SecretService from "../services/secrets.service";
import DBRepository from "../repositories/db.repository";
import {QUEUE_CONFIG} from "../config/queue/aws.sqs";
import {v4 as uuidv4} from 'uuid';


class SQSJobClient {
    private static instance: SQSJobClient;
    private readonly client!: SQSClient;
    private poll: boolean = false;

    private constructor() {
        this.client = new SQSClient();
    }

    private async getMessage() {
        try {
            const config = JSON.parse(JSON.stringify(QUEUE_CONFIG));
            config["ReceiveRequestAttemptId"] = uuidv4();
            console.log(`Attempting poll with ReceiveRequestAttemptId ${config["ReceiveRequestAttemptId"]}`);
            const command = new ReceiveMessageCommand(config);
            return await this.client.send(command);
        }
        catch (error) {
            console.log(error);
            this.poll = false;

        }
    }

    private async deleteMessage(receiptHandle: string | undefined) {
        try {

            if(!receiptHandle) {
                console.error('receiptHandle not found');
                return;
            }

            const config = {
                QueueUrl: QUEUE_CONFIG.QueueUrl,
                ReceiptHandle: receiptHandle
            }

            const deleteCommand = new DeleteMessageCommand(config);
            await this.client.send(deleteCommand);
        }
        catch (error) {
            console.log(error);
        }
    }

    private async Poll() {
        const response = await this.getMessage();
        if (response === undefined) {
            console.error(`Failed to get message from SQS server`);
            return;
        }
        const messageBatch = response.Messages;
        if (messageBatch === undefined || messageBatch.length === 0) {
            console.log(`No messages were returned for ReceiveRequestAttemptId ${response.$metadata.requestId}`);
            return;
        }
        const message = messageBatch[0];
        try {
            const type = message.MessageAttributes?.type
            if (type === undefined || type.StringValue === undefined) {
                console.error('Unknown message');
                return message.ReceiptHandle;
            }
            const deploymentType = type.StringValue;
            console.log(`Received message with id ${message.MessageId} & type ${deploymentType}`)
            const body = message.Body;

            if (body === undefined) {
                console.error(`Invalid body for message with id ${message.MessageId} and type ${deploymentType}`);
                return message.ReceiptHandle;
            }
            const parsedBody = safeParseJSON<MESSAGE_BODY>(body);
            if (parsedBody === null) {
                console.error(`Invalid body for message with id ${message.MessageId} and type ${deploymentType}`);
                return message.ReceiptHandle;
            }
            const escTask = new EcsTasks(new SecretService(), DBRepository.getInstance());
            await escTask.spawnBuilder(parsedBody, deploymentType);
            await this.deleteMessage(message.ReceiptHandle);
        }

        catch (error) {
            await this.deleteMessage(message.ReceiptHandle);
            console.error("Failed to poll message or something went wrong", error);
        }
    }

    public async startScheduler() {
        this.poll = true;
        while (this.poll) {
            await this.Poll();
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }


    public static getInstance() {
        if (!SQSJobClient.instance) {
            SQSJobClient.instance = new SQSJobClient();
        }
        return SQSJobClient.instance;
    }
}

export default SQSJobClient;
