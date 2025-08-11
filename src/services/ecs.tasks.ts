import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import {ECS_TASK_CONFIG, ENVIRONMENT_OVERRIDES_PATH} from "../config/container/aws.ecs";
import {MESSAGE_BODY} from "../interfaces/sqs.message";
import {clone, getValueFromJSON} from "../utils/common.utils";
import SecretService from "./secrets.service";
import DBRepository from "../repositories/db.repository";
import {v4 as uuidv4} from "uuid";
const client = new ECSClient();

class ESCTask {
    private client!: ECSClient;
    private secretService: SecretService;
    private dbRepository:  DBRepository;

    constructor(secretService: SecretService, dbRepository: DBRepository) {
        this.client = new ECSClient();
        this.secretService = secretService;
        this.dbRepository = dbRepository;
    }

    private async spawnBuildContainer(input: typeof ECS_TASK_CONFIG) {
        // @ts-ignore
        const command = new RunTaskCommand(input);
        const response = await client.send(command);
        if (response.failures && response.failures.length > 0) {
            console.log(response.failures);
            throw new Error("Error while executing ESC task");
        }
        console.log("Successfully sent request to spin up build container");
        return response;
    }

    private setOverRides(input: typeof ECS_TASK_CONFIG, messageBody: MESSAGE_BODY, requestType:string) {
        Object.entries(ENVIRONMENT_OVERRIDES_PATH).forEach(([key, path]) => {
            console.log(`Key: ${key}, Path: ${path}`);
            const value = getValueFromJSON(messageBody, path, "");
            if (value) {
                console.log(`Found value for key ${key}`);
                input.overrides.containerOverrides[0].environment.push(
                    {
                        "name": key,
                        "value": value,
                    }
                );
            }
        });

        input.overrides.containerOverrides[0].environment.push(
            {
                "name": "REQUEST_TYPE",
                "value": requestType,
            }
        )
    }

    private async putTokenInSecrets(messageBody: MESSAGE_BODY, input: typeof ECS_TASK_CONFIG) {
        const token = await this.dbRepository.getTokenAndUser(messageBody.meta.token_id);
        const secretAccessTokenKey = uuidv4();
        const accessTokenSecret = {
            "GIT_ACCESS_TOKEN": token?.access_token,
        }
        input.overrides.containerOverrides[0].environment.push(
            {
                "name": "GIT_ACCESS_TOKEN_KEY",
                "value": secretAccessTokenKey,
            },
            {
                "name": "GIT_USER_NAME",
                "value": token?.handle,
            }
        );
        await this.secretService.storeSecrets(secretAccessTokenKey, JSON.stringify(accessTokenSecret));
    }

    private async updateDeploymentStatus(messageBody: MESSAGE_BODY) {
        const deployment_id = messageBody.deployment?.deployment_id;
        if (!deployment_id) {
            throw new Error("Missing deployment id");
        }
        await this.dbRepository.updateDeploymentStatus(deployment_id, "BUILD_IN_PROGRESS");
    }

    public async spawnBuilder(messageBody: MESSAGE_BODY, requestType: string): Promise<void> {
        const config = clone(ECS_TASK_CONFIG);
        if(config === null) {
            throw new Error("Missing config");
        }

        this.setOverRides(config, messageBody, requestType);
        await this.putTokenInSecrets(messageBody, config);
        await this.updateDeploymentStatus(messageBody);
        await this.spawnBuildContainer(config);
    }
}

export default ESCTask;
