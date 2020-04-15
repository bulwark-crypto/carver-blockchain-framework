import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { WidgetContext } from '../../carverUser/context';
import { Page } from '../../carverUser/pages';

const withCommandInitialize: Reducer = ({ state, event }) => {
    if (state.isInitialized) {
        throw commonLanguage.errors.isAlreadyInitialized;
    }
    const { id } = event.payload;

    return withState(state)
        .set({
            isInitialized: true,
            id
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced, // Add/Override these fields ...
                payload: {
                    id
                }
            }] // Emits publicState id to frontend
        });
}

const withCommandWidgetsAdd: Reducer = ({ state, event }) => {
    const widgetContexts = event.payload

    return withState(state)
        .set({
            widgets: [
                ...state.widgets,
                ...widgetContexts
            ]
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [] //@todo
            //payload: getWidgetContextsWithParent(state, widgetContexts)
        });
}
const withCommandWidgetsRemove: Reducer = ({ state, event }) => {
    const widgetIdsToRemove = event.payload as string[];

    const widgets = (state.widgets as WidgetContext[]).reduce((widgets, widgetId) => {
        if (widgetIdsToRemove.find(widgetIdToRemove => widgetIdToRemove === widgetId.id)) {
            return widgets
        }
        return [...widgets, widgetId]
    }, []);

    return withState(state)
        .set({
            widgets
        })
        .emit({
            type: commonLanguage.events.Updated,
            payload: [] //@todo
            /*payload: [{
                type: commonLanguage.events.Clear, // Delete objects from display ...
                payload: widgetIdsToRemove, // ... from these specific object ....
                id: state.id // ... in the root object
            },
            ]*/
        });
}

/*
const withCommandWidgetsSet: Reducer = ({ state, event }) => {
    const widgetContexts = event.payload

    return withState(state)
        .set({
            widgets: [
                ...widgetContexts
            ]
        })
        .emit({
            type: commonLanguage.events.Updated,

            payload: [{
                // Reduce root state
                type: commonLanguage.events.Updated,
                path: [{ exact: 'widgets' }],
                payload: widgetContexts
            }]
        });
}*/

const withCommandWidgetsInitialize: Reducer = ({ state, event }) => {
    const { id } = event;
    const initialState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced, // Add/Override these fields ...
                path: [
                    { exact: `widgets` }, /// ... find a specific widget
                    { find: { id } } // ... with a specific widget id
                ],

                payload: initialState
            }]
        });
}
const withCommandPagesNavigate: Reducer = ({ state, event }) => {
    /*const page = event.payload as Page;
    const { title } = page;

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced, // Add/Override these fields ...

                //@todo should the structure be "page: {widgets:[]}" ?

                payload: {
                    title
                }
            }]
        });*/



    const { page, widgetContexts } = event.payload
    const { title, breadcrumbs, pathname } = page as Page;

    return withState(state)
        .set({
            widgets: [
                ...widgetContexts
            ],
            page: { title, breadcrumbs, pathname }
        })
        .emit({
            type: commonLanguage.events.Updated,

            payload: [
                {
                    type: commonLanguage.events.Reduced,
                    payload: {
                        widgets: widgetContexts,
                        page: { title, breadcrumbs, pathname }
                    }
                }, {
                    type: commonLanguage.events.PublicEvents.Emit,
                    payload: {
                        type: commonLanguage.events.PublicEvents.PageNavigated
                    }
                }
            ]
        });
}
const withCommandWidgetsUpdate: Reducer = ({ state, event }) => {
    const { id } = event;
    const newWidgetState = event.payload

    return withState(state)
        .emit({
            type: commonLanguage.events.Updated,
            payload: [{
                type: commonLanguage.events.Reduced,  // Update these fields ...
                path: [
                    { exact: `widgets` }, /// ... find a specific widget
                    { find: { id } } // ... with a specific widget id
                ],

                payload: {
                    ...newWidgetState
                }
            }]
        });
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })

        .reduce({ type: commonLanguage.commands.Pages.Navigate, event, callback: withCommandPagesNavigate })

        .reduce({ type: commonLanguage.commands.Widgets.Add, event, callback: withCommandWidgetsAdd })
        .reduce({ type: commonLanguage.commands.Widgets.Remove, event, callback: withCommandWidgetsRemove })
        //.reduce({ type: commonLanguage.commands.Widgets.Set, event, callback: withCommandWidgetsSet })
        .reduce({ type: commonLanguage.commands.Widgets.Initialize, event, callback: withCommandWidgetsInitialize })
        .reduce({ type: commonLanguage.commands.Widgets.Update, event, callback: withCommandWidgetsUpdate });
}

const commonLanguage = {
    type: 'PUBLIC_STATE',
    commands: {
        Initialize: 'INITIALIZE',
        Pages: {
            Navigate: 'PAGES:NAVIGATE'
        },
        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            //Set: 'WIDGETS:SET',
            Initialize: 'WIDGETS:INITIALIZE',
            Update: 'WIDGETS:UPDATE',
        }
    },
    queries: {
    },
    events: {
        Updated: 'UPDATED',

        Pushed: 'PUSHED', // Add to object id. Object { children:[{object},{object},{object}] }
        Reduced: 'REDUCED', // Update object by id
        Clear: 'CLEAR',

        PublicEvents: {
            Emit: 'PUBLIC:EMIT',

            PageNavigated: 'PAGE_NAVIGATED' // This is used on frontend for things like title & url updates
        }
    },
    errors: {
        isAlreadyInitialized: 'You can only initialize state once'
    }
}

const initialState = {
    widgets: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}