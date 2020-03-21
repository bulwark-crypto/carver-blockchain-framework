import { Event } from '../interfaces/events'
import { RegisteredContext } from '../contexts/registeredContext';

export interface EventStore {
    store: (events: Event[]) => Promise<void>;
    streamEvents: (params: ReplayEventsParams) => void;
    unbindAllListeners: () => Promise<void>;
}

export interface ReplayEventsParams {
    type?: string;
    sequence?: number;
    callback: (event: Event) => Promise<void>;
    /**
     * If set to true only stream events that occured after the app was started
     */
    sessionOnly?: boolean;
    //@todo add lastPlayedId
}