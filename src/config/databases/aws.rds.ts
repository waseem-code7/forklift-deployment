const DB_CONNECTION_CONF = {
    host: "forklift.c5m6qkyswr92.ap-south-1.rds.amazonaws.com",
    port: parseInt(process.env.AWS_RDS_PORT || "5432", 10),
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    min: 5, // minimum number of connections to keep in the pool
    max: 20, // maximum number of connections to keep in the pool
    ssl: {
        rejectUnauthorized: false
    },
    application_name: "forklift-deployments",
    query_timeout: 30000, // 30 seconds
}

const DATABASES =  {
    deployments: "deployments",
    auth: "auth"
} as const;

export default {
    DB_CONNECTION_CONF,
    DATABASES
};