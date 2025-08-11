import MultiDatabaseService from "./repositories/init.db";
import SQSJobClient from "./subscribers/sqs";
const grpc = require("@grpc/grpc-js");

const server = new grpc.Server();

function startServer() {
    try {
        server.bindAsync("0.0.0.0:7006", grpc.ServerCredentials.createInsecure(), (error: any, port: string) => {
            if (error) {
                console.error(" Failed to bind server:", error);
                return;
            }
            SQSJobClient.getInstance().startScheduler();
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
