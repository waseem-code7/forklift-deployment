import {PoolClient} from "pg";

export type TRANSACTION_CALLBACK<T> = (client: PoolClient) => Promise<T>;