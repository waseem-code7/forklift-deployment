import {SecretService} from "./generated/proto/deployment";
import DeploymentController from "./controller/secrets.controller";
import MultiDatabaseService from "./repositories/init.db";
const grpc = require("@grpc/grpc-js");

const server = new grpc.Server();

server.addService(SecretService, new DeploymentController())

function startServer() {
    try {
        server.bindAsync("0.0.0.0:7005", grpc.ServerCredentials.createInsecure(), (error: any, port: string) => {
            if (error) {
                console.error(" Failed to bind server:", error);
                return;
            }
            console.log(` gRPC server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

(async () => {
    try {
        const db = MultiDatabaseService.getInstance();
        db.InitializePools();
        console.log('Database pools initialized successfully');
        startServer();
    } catch (error) {
        console.error('Error initializing database pools:', error);
        process.exit(1);
    }
})();
