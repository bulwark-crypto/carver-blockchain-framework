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
    /**
     * isLatest will let you know if this is the most recent event based on the replay params.
     * For event batching we'll issue the batch as soon as event isLatest (That way we don't have to wait for the batch to fill up)
     */
    callback: (event: Event, isLatest: Boolean) => Promise<void>;
    /**
     * If set to true only stream events that occured after the app was started
     */
    sessionOnly?: boolean;
    //@todo add lastPlayedId
}