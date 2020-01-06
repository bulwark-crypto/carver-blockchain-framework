export interface Event {
    //id?: number;
    type: string;
    payload?: any;
    sequence?: any;
}
export interface Command {
    id?: number;
    type: string;
    payload: any;
}