export interface Event {
    id?: number;
    type: string;
    payload: any;
}
export interface Command {
    id?: number;
    type: string;
    payload: any;
}

export interface CreateEventParams {
    id?: number;
    type: string,
    payload?: any;
}
export const createEvent = ({ id, type, payload }: CreateEventParams): Event => {
    return { id, type, payload }
}