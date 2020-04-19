import React, { useReducer } from 'react';

import { reducer as carverUserReducer, initialState as carverUserInitialState } from '../../carver/contexts/publicState/context'

interface Breadcrumb {
    title: string;
    href?: string;
    pathname?: string;
}
interface Page {
    title: string;
    breadcrumbs?: Breadcrumb[];
    variants: any[];
}
export interface CarverUser {
    widgets: any[];
    page: Page
}
export interface CarverUserContextValue {
    state: CarverUser;
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