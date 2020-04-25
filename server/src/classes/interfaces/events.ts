/**
 * Domain Event (Something that happened). In Carver Framework all reducer commands are side effects of an event that happened.
 * 
 * @todo I've been thinking more and more to rename this to DomainEvent to avoid conflicts with numerous other "Event" names in node and libs.
 * Another solution would be to introduce a namespace
 */
export interface Event {
    //id?: number;
    id?: any;
    type?: string;
    payload?: any;
    sequence?: any;
}
export interface Command {
    id?: number;
    type: string;
    payload: any;
}