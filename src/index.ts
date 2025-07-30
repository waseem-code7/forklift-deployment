import {SecretService} from "./generated/proto/deployment";
import DeploymentController from "./controller/secrets.controller";
const grpc = require("@grpc/grpc-js");

const server = new grpc.Server();

server.addService(SecretService, new DeploymentController())

server.bindAsync("0.0.0.0:7005", grpc.ServerCredentials.createInsecure(), (error: any, port: string) => {
    if (error) {
        console.error(" Failed to bind server:", error);
        return;
    }
    console.log(` gRPC server is running on port ${port}`);
});
