import React, { useReducer } from 'react';

import { reducer as carverUserReducer, initialState as carverUserInitialState } from '../../carver/contexts/publicState/context'

export interface CarverUserContextValue {
    state: any;
    dispatch: any;
}

const CarverUserContext = React.createContext<CarverUserContextValue>(null as any);

const CarverUserContextProvider: React.FC = ({ children }) => {
    const [state, dispatch] = useReducer(carverUserReducer, carverUserInitialState);

    return (<CarverUserContext.Provider value={{ state, dispatch }}>
        {children}
    </CarverUserContext.Provider>
    );
}

export {
    CarverUserContext,
    CarverUserContextProvider
}