import { Reducer, Event, Widget } from "../../interfaces";

const reducer: Reducer = (state, event) => {
    const messages = event.payload; // Messages will come in as array of events

    return messages.reduce((state: any, message: any) => {
        const { type } = message;

        switch (type) {
            case commonLanguage.events.Pushed:
                {
                    const { id, parent, payload } = message;

                    return {
                        ...state,
                        objects: {
                            ...state.objects,
                            [id]: { ...payload, id } // The object will contain it's own id
                        },
                        children: {
                            [parent]: (state.children[parent] ? [...state.children[parent], id] : [id])
                        },
                        rootId: (!parent ? id : state.rootId)
                    }
                }

            case commonLanguage.events.Clear: //@todo Will this become .Remove once conditions are added?
                {
                    const { id, payload: idsToRemove } = message;

                    // Remove any existing children of this object (currently this does not support nesting)
                    const children = state.children[id] as any[]

                    const objectIdsToremove = [] as string[];

                    const newChildren = (!!children ? children : []).reduce((children, id) => {
                        // Remove all children if ids are not specified
                        if (!idsToRemove) {
                            objectIdsToremove.push(id);
                            return children;
                        }

                        if (idsToRemove.includes(id)) {
                            objectIdsToremove.push(id);
                            return children;
                        }

                        return [
                            ...children,
                            id
                        ]
                    }, []);

                    const newObjects = !children ? state.objects : Object.keys(state.objects).reduce((newObjects, id) => {
                        if (objectIdsToremove.includes(id)) {
                            return newObjects;
                        }

                        return {
                            ...newObjects,
                            [id]: state.objects[id]
                        }
                    }, {})

                    return {
                        ...state,
                        objects: newObjects,
                        children: {
                            [id]: newChildren
                        },
                    }
                }
            case commonLanguage.events.Reduced:
                {
                    const { id, payload } = message;

                    return {
                        ...state,
                        objects: {
                            ...state.objects,
                            [id]: {
                                ...state.objects[id],
                                ...payload
                            }
                        }
                    }
                }
        }
        return state
    }, state)

}
// Alternative is to nest children inside object:
/*objects: {
    ...state.objects,
    [id]: payload,
    [parent]: {
        ...state.objects[parent],
        children: [
            ...(state.objects[parent] && state.objects[parent].children ? [...state.objects[parent].children] : []),
            id
        ]
    }
},*/

const commonLanguage = {
    //@todo move commands to carverUser context
    commands: {
        Connect: 'CONNECT',

        Widgets: {
            Add: 'WIDGETS:ADD',
            Remove: 'WIDGETS:REMOVE',
            Emit: 'WIDGETS:EMIT',
            Command: 'WIDGETS:COMMAND',
        },
        Pages: {
            Navigate: 'NAVIGATE'
        },
    },

    events: {
        // All public state socket messages will contain this type (The payload will be array of events below)
        Updated: 'UPDATED',

        // Add a set of children to an object
        Pushed: 'PUSHED',
        // Remove all children on object (Remove previous ones too)
        Clear: 'CLEAR',

        Removed: 'REMOVED',
        Reduced: 'REDUCED',


    }
}
const initialState = {
    objects: {},
    children: {},
    root: null
}

export {
    initialState,
    reducer,
    commonLanguage
}