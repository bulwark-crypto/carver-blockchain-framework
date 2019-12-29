export interface Event {
    //id?: number;
    type: string;
    payload?: any;
}
export interface Command {
    id?: number;
    type: string;
    payload: any;
}