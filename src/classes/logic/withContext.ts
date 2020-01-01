import { RegisteredContext } from "../../classes/contextStore";
import { Event } from "../interfaces/events";
import { ReplayEventsParams } from "../interfaces/eventStore";

interface StreamEventsFromContextParams {
    type: string;
    context: RegisteredContext;
}

interface WithContextChain {
    /**
     * Dispatch a command, store any new events
     * @todo the id of event should be mandatory here (the devents that are emitted are based on this event id)
     */
    dispatch: (event: Event) => Promise<WithContextChain>;
    /**
     * Stream events in automatically from the last sequence @todo redo to streamEventsToContext?
     */
    streamEventsFromContext: (params: StreamEventsFromContextParams) => WithContextChain;
    streamEvents: (params: ReplayEventsParams) => WithContextChain;
    handleRequest: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;
    handleQuery: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;
    handleStore: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;

}
const withContext = (context: RegisteredContext) => {
    const contextChain = {} as WithContextChain

    contextChain.dispatch = async (event: Event) => {
        await context.dispatch(event);

        return contextChain;
    }

    // The old way of streaming events to context
    /*
    contextChain.streamEventsFromContext = ({ type, context: streamFromContext }: StreamEventsFromContextParams) => {
        // Events will be streamed from the source into our context
        const callback = async (event: Event) => {
            await context.eventStore.emit(event);
        };

        streamFromContext.eventStore.replayEventsToCallback({ type, callback });
        return contextChain;
    }*/

    contextChain.streamEvents = (params: ReplayEventsParams) => {
        context.eventStore.streamEvents(params); //@todo withEventStore(eventStore).streamEvents? Move this out?

        return contextChain;
    }

    contextChain.handleRequest = (type: string, callback: (event: Event) => Promise<any>) => {
        context.subscribeToRequest(type, callback);

        return contextChain;
    }
    contextChain.handleStore = (type: string, callback: (event: Event) => Promise<any>) => {
        context.subscribeToStore(type, callback);

        return contextChain;
    }


    contextChain.handleQuery = contextChain.handleRequest;

    return contextChain;
}

export {
    withContext
}