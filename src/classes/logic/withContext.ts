import { RegisteredContext } from "../contexts/contextStore";
import { Event } from "../interfaces/events";
import { ReplayEventsParams } from "../interfaces/eventStore";

interface WithContextChain {
    /**
     * Dispatch a command, store any new events
     * @todo the id of event should be mandatory here (the devents that are emitted are based on this event id)
     */
    dispatch: (event: Event) => Promise<WithContextChain>;
    streamEvents: (params: ReplayEventsParams) => WithContextChain;
    handleQuery: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;
    handleStore: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;

}
const withContext = (context: RegisteredContext) => {
    const contextChain = {} as WithContextChain

    contextChain.dispatch = async (event: Event) => {
        await context.dispatch(event);

        return contextChain;
    }

    contextChain.streamEvents = (params: ReplayEventsParams) => {
        context.streamEvents(params);

        return contextChain;
    }

    contextChain.handleQuery = (type: string, callback: (event: Event) => Promise<any>) => {
        context.handleQuery(type, callback);

        return contextChain;
    }
    contextChain.handleStore = (type: string, callback: (event: Event) => Promise<any>) => {
        context.handleStore(type, callback);

        return contextChain;
    }


    return contextChain;
}

export {
    withContext
}