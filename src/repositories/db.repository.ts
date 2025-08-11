import {DEPLOYMENT, IDBRepository, TOKEN, USER} from "../interfaces/db.repository";
import MultiDatabaseService from "./init.db";

export class DBRepository implements IDBRepository {

    static instance: DBRepository;
    private database: MultiDatabaseService;

    private constructor() {
        this.database = MultiDatabaseService.getInstance();
    }

    public static getInstance(): DBRepository {
        if (DBRepository.instance) {
            return this.instance;
        }
        DBRepository.instance = new DBRepository();
        return DBRepository.instance;
    }

    private getOneResultFromQuery<T>(queryResult: any): (T | null) {
        if (Array.isArray(queryResult)) {
            return queryResult[0];
        } else if (queryResult && queryResult.rows && queryResult.rows.length > 0) {
            return queryResult.rows[0] as T;
        }
        return null;
    }

    async getTokenAndUser(token_id: string): Promise<(TOKEN & USER) | null> {
        const queryResult = await this.database.query("auth", "SELECT * FROM users u INNER JOIN tokens t ON u.id = t.user_id WHERE t.id = $1", [token_id])
        return this.getOneResultFromQuery<TOKEN & USER>(queryResult);
    }

    async updateDeploymentStatus(deployment_id: string, status: string): Promise<DEPLOYMENT | null> {
        const queryResult = await this.database.query("deployments", "UPDATE deployments set status = $1 WHERE deployment_id = $2 RETURNING *", [status, deployment_id]);
        return this.getOneResultFromQuery<DEPLOYMENT>(queryResult);
    }
}

export default DBRepository;