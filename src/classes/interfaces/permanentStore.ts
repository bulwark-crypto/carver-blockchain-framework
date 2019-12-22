
export interface PermanentStore {
    store: (objects: any[]) => Promise<void>;
}