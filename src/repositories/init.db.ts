import {Pool, PoolClient, PoolConfig} from 'pg';
import CONFIG from "../config/databases/aws.rds";
import {TRANSACTION_CALLBACK} from "../interfaces/db.repository";

const DATABASES = CONFIG.DATABASES;
const DB_CONNECTION_CONF = CONFIG.DB_CONNECTION_CONF;
type DATABASES_NAMES = keyof typeof DATABASES;

class MultiDatabaseService {
    private static instance: MultiDatabaseService;
    private databases!: Map<DATABASES_NAMES, Pool>;

    private constructor() {
        this.databases = new Map();
    }

    public static getInstance(): MultiDatabaseService {
        if (!MultiDatabaseService.instance) {
            MultiDatabaseService.instance = new MultiDatabaseService();
        }
        return MultiDatabaseService.instance;
    }

    public InitializePools() {
        Object.keys(DATABASES).forEach((database) => {
            const config: PoolConfig = {
                ...DB_CONNECTION_CONF,
                database: DATABASES[database as DATABASES_NAMES]
            }

            const pool = new Pool(config);

            pool.on("connect", () => {
                console.log(`New client connected to ${database} database pool`);
            })

            pool.on("error", (err: Error) => {
                console.error(`Error in ${database} database pool:`, err);
            })

            pool.on('remove', (client) => {
                console.log(`Client removed from ${database} database pool`);
            });

            this.databases.set(database as DATABASES_NAMES, pool);
        });
    }

    public getPool(database: DATABASES_NAMES): Pool {
        if (!this.databases.has(database)) {
            throw new Error(`Database pool for ${database} does not exist`);
        }
        return this.databases.get(database)!;
    }

    public async query<T>(database: DATABASES_NAMES, query: string, params?: any[]): Promise<T[] | undefined | null> {
        const pool = this.getPool(database);
        const client = await pool.connect();
        try {
            const result = await client.query(query, params);
            return result.rows as T[];
        }
        catch (e) {
            console.error(`Error while querying database ${database}: ${e}`);
        }
        finally {
            client.release();
        }
    }

    public async executeTransaction<T>(database: DATABASES_NAMES, callback: TRANSACTION_CALLBACK<T>): Promise<T> {
        const pool = this.getPool(database);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    public async executeCrossDatabaseTransaction<T>(databases: DATABASES_NAMES[], callback: (clients: Map<DATABASES_NAMES, PoolClient>) => Promise<T>): Promise<T> {
        const clients = new Map<DATABASES_NAMES, PoolClient>();
        try {
            for (const db of databases) {
                const pool = this.getPool(db);
                const client = await pool.connect();
                clients.set(db, client);
                await client.query('BEGIN');
            }

            const result = await callback(clients);

            for (const client of clients.values()) {
                await client.query('COMMIT');
            }
            return result;
        } catch (e) {
            for (const client of clients.values()) {
                await client.query('ROLLBACK');
            }
            throw e;
        } finally {
            for (const [db, client] of clients.entries()) {
                client.release();
            }
        }
    }

    public async closeAllPools(): Promise<void> {
        for (const [database, pool] of this.databases.entries()) {
            await pool.end();
            console.log(`Closed pool for ${database} database`);
        }
        this.databases.clear();
    }

}

export default MultiDatabaseService;