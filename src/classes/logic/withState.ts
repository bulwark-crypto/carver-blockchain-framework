import { Event, createEvent } from '../interfaces/events'
import { ReducerParams } from '../interfaces/context'

type Reducer = (params: ReducerParams) => WithStateChain;
interface ReduceParams {
    type?: string;
    event: Event;
    callback: (params: ReducerParams) => any;
}
interface WithStateChain {
    state: any;
    isStateChain: boolean;
    reduce: ({ type, event, callback }: ReduceParams) => WithStateChain;
    emit: (type: string, payload?: any) => WithStateChain;
    set: (params: any) => WithStateChain;
    request: (type: string, payload?: any) => WithStateChain;
    query: (type: string, payload?: any) => WithStateChain;
}
const withState = (state: any) => {

    const stateChain = {
        state,
        isStateChain: true // So we can identify chains after reducing
    } as WithStateChain

    stateChain.reduce = ({ type, event, callback }: ReduceParams) => {
        if (type) {
            if (type !== event.type) {
                return stateChain;
            }
        }
        const reducerResults = callback({ state: stateChain.state, event });
        stateChain.state = reducerResults.isStateChain ? reducerResults.state : reducerResults;
        return stateChain;
    }
    stateChain.emit = (type: string, payload: any = null) => {

        stateChain.state = {
            ...stateChain.state,
            emit: [
                ...(stateChain.state.emit ? stateChain.state.emit : []),
                createEvent({ type, payload })
            ]
        };
        return stateChain;
    }
    stateChain.set = (params: any) => {
        stateChain.state = {
            ...stateChain.state,
            ...params
        }

        return stateChain;
    }
    stateChain.request = (type: string, payload?: any) => {

        stateChain.state = {
            ...stateChain.state,
            request: [
                ...(stateChain.state.request ? stateChain.state.request : []),
                createEvent({ type, payload })
            ]
        };

        return stateChain;
    }
    stateChain.query = stateChain.request;

    return stateChain;
}

export {
    withState,
    WithStateChain,
    Reducer
}