import { Reducer, Event, Widget } from "../../interfaces";
import * as _ from "lodash";

interface Message {
    type: string;
    payload: any;
    path?: string;
    find?: string;
}

const reducer: Reducer = (state, payload: any) => {
    let newState = { ...state }

    const getFullPath = (message: Message) => {
        const { path, find } = message;

        if (find) {
            const data = path ? _.get(newState, path) : newState
            const index = _.findIndex(data, find);
            return path ? `${path}.${index}` : index
        }

        return path;
    }

    (payload as Message[]).forEach((message: Message) => {
        const { type, payload } = message;
        const fullPath = getFullPath(message);

        switch (type) {
            /*case commonLanguage.events.Pushed:
                {
                    const { payload } = message;

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
                }*/
            case commonLanguage.events.Reduced:
                {
                    if (fullPath) {
                        const currentValue = _.get(newState, fullPath);

                        if (Array.isArray(currentValue)) {
                            _.set(newState, fullPath, [
                                ...currentValue,
                                ...payload
                            ]);
                        } else {
                            _.set(newState, fullPath, {
                                ...currentValue,
                                ...payload
                            });
                        }
                    } else {
                        newState = {
                            ...newState,
                            ...payload
                        }
                    }

                    console.log('REDUCED full path:', fullPath, payload);
                }
                break;
            case commonLanguage.events.Updated:

                if (fullPath) {
                    _.set(newState, fullPath, payload);
                    console.log('UPDATED  full path:', fullPath, payload);
                    break;
                } else {
                    newState = payload
                }
                break;
        }
    });

    console.log('++++newState:', newState)

    return newState;
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
    //objects: {},
    //children: {},
    //root: null
    id: null as string | null, // public id of carver user, set at load time
    widgets: []
}

export {
    initialState,
    reducer,
    commonLanguage
}