
export interface Event {
    id?: number;
    type: string;
    payload: any;
}
export type Reducer = (state: any, event: Event) => any;

export interface WidgetConfiguration {
    variant: string;
    display: string;
}
export interface Widget {
    id: number;
    configuration: WidgetConfiguration;
}