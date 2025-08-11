export function safeParseJSON<T>(data: string): T | null {
    try {
        return JSON.parse(data) as T;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return null;
    }
}

export function getValueFromJSON(data: any, path: string, defaultValue: string | undefined) {
    try {
        return path.split('.').reduce((acc, key) => {
            if (acc === undefined || acc === null) {
                return acc;
            }
            if (Array.isArray(acc)) {
                if (parseInt(key, 10) < acc.length) {
                    return acc[parseInt(key, 10)];
                }
                return undefined;
            }
            return acc?.[key];
        }, data);
    }
    catch (error) {
        console.error('Failed to get value:', error);
        return defaultValue;
    }
}

export function clone<T>(data: T): T | null {
    try {
        return JSON.parse(JSON.stringify(data));
    }
    catch (e) {
        return null;
    }
}