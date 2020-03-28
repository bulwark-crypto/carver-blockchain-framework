import React, { useReducer } from 'react';

import { reducer as LoggerReducer, initialState as LoggerInitialState } from '../../carver/contexts/publicState/context'
import { commonLanguage as loggerCommonLanguage } from '../../carver/contexts/logger/context'

export interface LoggerContextValue {
    state: any;
    dispatch: any;
}

const useLogger = (reducer: any) => {
    const addLog = (...args: any) => {
        reducer({ type: loggerCommonLanguage.commands.Add, payload: args });
    }

    return {
        addLog
    }
}

const LoggerContext = React.createContext<LoggerContextValue>(null as any);

const LoggerContextProvider: React.FC = ({ children }) => {
    const [state, dispatch] = useReducer(LoggerReducer, LoggerInitialState);

    return (<LoggerContext.Provider value={{ state, dispatch }}>
        {children}
    </LoggerContext.Provider>
    );
}

export {
    LoggerContext,
    LoggerContextProvider,
    useLogger
}