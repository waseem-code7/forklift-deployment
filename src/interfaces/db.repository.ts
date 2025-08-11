import {PoolClient} from "pg";

export type TRANSACTION_CALLBACK<T> = (client: PoolClient) => Promise<T>;

export type USER = {
    id: string;
    handle: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    platform: string;
}

export type TOKEN = {
    id: string;
    user_id: string;
    access_token: string;
    refresh_token?: string;
    created_at: Date;
    provider: string;
    scopes?: any;
    deleted: boolean;
    type: string;
};

export type DEPLOYMENT = {
    deployment_id: string;
    branch_id: string;
    status: string;
    commit_id: string;
    created_at: Date;
}


export interface IDBRepository {
    getTokenAndUser(token_id: string): Promise<TOKEN & USER | null>; // Retrieve a token by its ID
    updateDeploymentStatus(deployment_id: string, status: string): Promise<DEPLOYMENT | null>;
}