import { RegisteredContext } from "../../classes/eventStore";
import { Event, createEvent } from "../interfaces/events";

interface StreamEventsFromContextParams {
    type: string;
    context: RegisteredContext;
}
interface StreamEventsParams {
    type: string;
    callback: (payload: any) => Promise<any>;
}

interface WithContextChain {
    emit: (type: string, payload?: any) => Promise<WithContextChain>;
    /**
     * Stream events in automatically from the last sequence @todo redo to streamEventsToContext?
     */
    streamEventsFromContext: (params: StreamEventsFromContextParams) => WithContextChain;
    streamEvents: (params: StreamEventsParams) => WithContextChain;
    handleRequest: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;
    handleQuery: (type: string, callback: (payload: any) => Promise<any>) => WithContextChain;

}
const withContext = (context: RegisteredContext) => {
    const contextChain = {} as WithContextChain

    contextChain.emit = async (type: string, payload: any = null) => {
        context.eventStore.emit(createEvent({ type, payload }));

        return contextChain;
    }

    contextChain.streamEventsFromContext = ({ type, context: streamFromContext }: StreamEventsFromContextParams) => {
        // Events will be streamed from the source into our context
        const callback = async (event: Event) => {
            await context.eventStore.emit(event);
        };

        streamFromContext.eventStore.replayEventsToCallback({ type, callback });
        return contextChain;
    }

    contextChain.streamEvents = ({ type, callback }: StreamEventsParams) => {
        context.eventStore.replayEventsToCallback({ type, callback });

        return contextChain;
    }

    contextChain.handleRequest = (type: string, callback: (event: Event) => Promise<any>) => {
        context.subscribeToRequest(type, callback);
        return contextChain;
    }
    contextChain.handleQuery = contextChain.handleRequest;

    return contextChain;
}

export {
    withContext
}