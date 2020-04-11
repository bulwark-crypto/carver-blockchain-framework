import { Reducer, Event, Widget } from "../../interfaces";
import * as _ from "lodash";

interface Message {
    type: string;
    payload: any;
    path?: any[];
    find?: string;
}

const reducer: Reducer = (state, payload: any) => {
    let newState = { ...state }

    const getFullPath = (message: Message) => {
        const { path } = message;

        if (!path) {
            return null;
        }

        const fullPath = path.reduce((fullPath, currentPath) => {
            const { exact, find } = currentPath

            if (exact) {
                return fullPath ? `${fullPath}.${exact}` : exact;
            }
            if (find) {
                const data = fullPath ? _.get(newState, fullPath) : newState
                const index = _.findIndex(data, find);
                return fullPath ? `${fullPath}.${index}` : index;
            }

            return fullPath;
        }, '');

        return fullPath;
    }

    (payload as Message[]).forEach((message: Message) => {
        const { type, payload } = message;
        const fullPath = getFullPath(message);

        switch (type) {
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
                }
                break;
            case commonLanguage.events.Updated:

                if (fullPath) {
                    _.set(newState, fullPath, payload);
                    break;
                } else {
                    newState = payload
                }
                break;
        }
    });

    return newState;
}

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