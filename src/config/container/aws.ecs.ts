import {KeyValuePair} from "@aws-sdk/client-ecs";

export const ECS_TASK_CONFIG = {
    cluster: process.env.AWS_ECS_CLUSTER,
    count: 1,
    enableECSManagedTags: false,
    enableExecuteCommand: true,
    launchType: "FARGATE",
    networkConfiguration: {
        awsvpcConfiguration: {
            subnets: ["subnet-026c3304aa67c19ed"]
        }
    },
    overrides: {
        containerOverrides: [
            {
                name: "forklift-builder-container", // required field
                environment: [] as KeyValuePair[]
            }
        ]
    },
    taskDefinition: process.env.AWS_TASK_DEFINATION
};

export const ENVIRONMENT_OVERRIDES_PATH = {
    GIT_REPO_NAME: "repository.repo_name",
    S3_BUCKET: "meta.s3_bucket",
    VERSION_ID: "meta.version_id",
    BRANCH_NAME: "branch.branch_name",
    DOMAIN: "meta.domain",
    DEPLOYMENT_ID: "deployment.deployment_id",
    REPO_ID:  "repository.repo_id",
    BRANCH_ID: "branch.branch_id"
}

