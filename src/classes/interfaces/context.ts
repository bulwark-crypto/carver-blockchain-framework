import { Event } from './events'
import { EventEmitter } from 'events';
import { createEventStore } from '../eventStore'

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
     * Every state can emit it's own events
     */
    emit?: Event[];
    /**
     * Every state can request outside context to handle it
     */
    request?: Event[];
}