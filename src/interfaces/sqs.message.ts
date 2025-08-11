type REPOSITORY = {
    repo_id?: string;
    user_id: string;
    repo_name: string;
    is_private: boolean;
    created_at?: Date;
    default_branch: string;
}

type BRANCH = {
    branch_id?: string;
    repo_id: string;
    branch_name: string;
    auto_deploy: boolean;
    created_at?: Date;
    updated_at?: Date
}

type DEPLOYMENT = {
    deployment_id?: string;
    branch_id: string;
    status: string;
    commit_id: string;
    created_at?: Date;
}

export interface MESSAGE_BODY {
    repository: REPOSITORY;
    branch: BRANCH;
    deployment: DEPLOYMENT;
    meta: Record<string, string>
}
