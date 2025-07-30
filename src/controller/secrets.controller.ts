import {
    GetSecretRequest,
    GetSecretResponse,
    PutSecretRequest,
    PutSecretResponse,
    Status,
    SecretServer
} from "../generated/proto/deployment";
import {sendUnaryData, ServerUnaryCall, UntypedHandleCall} from "@grpc/grpc-js";
import SecretService from "../services/secrets.service";
import {Status as GRPC_STATUS} from "@grpc/grpc-js/build/src/constants";

class DeploymentController implements SecretServer {

    [name: string]: UntypedHandleCall;

    async getSecret(call: ServerUnaryCall<GetSecretRequest, GetSecretResponse>, callback: sendUnaryData<GetSecretResponse>) {
        try {
            const secretService = new SecretService();
            const result = await secretService.getSecret(call.request.key);
            return callback(null, {key: result.Name || "", value: result.SecretString || "", status: Status.SUCCESS})
        }
        catch (error: any) {
            console.log(error);
            return callback({code: GRPC_STATUS.INTERNAL, message: error?.message || "Unknown error"});
        }
    }

    async putSecret(call: ServerUnaryCall<PutSecretRequest, PutSecretResponse>, callback: sendUnaryData<PutSecretResponse>) {
        try {
            const secretService = new SecretService();
            const result = await secretService.storeSecrets(call.request.key, call.request.value);
            return callback(null, {status: Status.SUCCESS, key: result.Name || ""})
        }
        catch (error: any) {
            console.error(error);
            return callback({code: GRPC_STATUS.INTERNAL, message: error?.message || "Unknown error"});
        }

    }
}

export default DeploymentController;