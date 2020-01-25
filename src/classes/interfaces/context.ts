import { Event } from './events'
import { EventEmitter } from 'events';

export interface ReducerParams {
    state: any;
    event: Event;
}
export interface Context {
    initialState: any;
    commonLanguage: any;
    reducer: <T>(params: ReducerParams) => T;
}
export interface State {

    /**
     * - Can not be queried
     * - Not stored
     */
    query?: Event[];

    /**
     * - Can be queried
     * - Handled out of order
     * - Storage external to binding (ex: store in db)
     */
    store?: Event[];

    /**
     * - Can not be queried
     * - Stored in order
     * - Can be streamed in batches
     * - Id of event is always the index where it was inserted. This allows multiple events to occur in the same Date/Time in order.
     */
    emit?: Event[];
}