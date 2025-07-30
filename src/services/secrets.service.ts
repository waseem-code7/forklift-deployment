import {SecretsManagerClient, CreateSecretCommand, GetSecretValueCommand} from "@aws-sdk/client-secrets-manager";

class SecretService {
    private secretsManagerClient: SecretsManagerClient;

    constructor() {
        this.secretsManagerClient = new SecretsManagerClient();
    }

    public storeSecrets(name: string, value: string) {
        const input = {
            Name: name,
            KmsKeyId: process.env.KMS_KEY_ARN,
            SecretString: value,
        };
        const command = new CreateSecretCommand(input);
        return this.secretsManagerClient.send(command)
            .then(response => {
                console.log("Secret stored successfully:", response);
                return response;
            })
            .catch(error => {
                console.error("Error storing secret:", error);
                throw error;
            });
    }

    public getSecret(name: string) {
        const input = {
            SecretId: name
        }

        const command = new GetSecretValueCommand(input)

        return this.secretsManagerClient.send(command).then(function(result) {
            return result;
        }).catch(function(error) {
            console.error("Error storing secret:", error);
            throw error;
        })
    }
}

export default SecretService;

