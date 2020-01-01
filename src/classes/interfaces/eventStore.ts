import { Event } from '../interfaces/events'

export interface EventStore {
    store: (events: Event[]) => Promise<void>;
    streamEvents: ({ type, callback }: ReplayEventsParams) => void;
}

export interface ReplayEventsParams {
    type: string;
    sequence?: number;
    callback: (event: Event) => Promise<void>;
    /**
     * If set to true only stream events that occured after thee app was started
     */
    sessionOnly?: boolean;
    //@todo add lastPlayedId
}