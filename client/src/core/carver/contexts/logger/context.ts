import { Reducer } from "../../interfaces";

const reducer: Reducer = (state, event) => {
    const { type, payload } = event;

    switch (type) {
        case commonLanguage.commands.Add:
            const timePrefix = new Date().toISOString()

            const log = JSON.stringify(payload);
            const logLine = `${timePrefix}: ${log}`;

            const lines = state.lines as string[];
            const newLines = [
                ...(lines.length > 10 ? lines.splice(lines.length - 10) : lines),
                logLine
            ]

            return {
                ...state,
                lines: newLines,
                textLog: newLines.reduce((linesText: string, line: string) => `${linesText}\n${line}`, '')
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
    lines: [] as string[],
    textLog: ''
}

export {
    initialState,
    reducer,
    commonLanguage
}