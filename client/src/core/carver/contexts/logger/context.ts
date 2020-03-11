import { Reducer } from "../../interfaces";

const reducer: Reducer = (state, event) => {
    const { type, payload } = event;

    switch (type) {
        case commonLanguage.commands.Add:
            const timePrefix = new Date().toISOString()

            const log = JSON.stringify(payload);
            const logLine = `${timePrefix}: ${log}\n`;

            return {
                ...state,
                textLog: state.textLog + logLine
            };
    }
    return state
}

const commonLanguage = {
    commands: {
        Add: 'ADD',
    },
}
const initialState = {
    textLog: ''
}

export {
    initialState,
    reducer,
    commonLanguage
}