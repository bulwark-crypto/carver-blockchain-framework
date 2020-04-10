import React, { useState, useEffect, useReducer } from 'react';

import { initReservationService } from '../../carver/reservations'

export interface SocketContextValue {
    socket: ReturnType<typeof initReservationService>;
    setSocket: React.Dispatch<ReturnType<typeof initReservationService>>;
}

const SocketContext = React.createContext<SocketContextValue>(null as any);

const SocketContextProvider: React.FC = ({ children }) => {
    const [socket, setSocket] = useState<any>();

    return <SocketContext.Provider value={{ socket, setSocket } as any}>{children}</SocketContext.Provider>
}

export {
    SocketContext,
    SocketContextProvider
}