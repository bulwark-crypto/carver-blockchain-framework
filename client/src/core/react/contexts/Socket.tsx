import React, { useState, useEffect, useReducer } from 'react';

export interface SocketContextValue {
    socket: SocketIOClient.Socket;
    setSocket: React.Dispatch<React.SetStateAction<SocketIOClient.Socket | undefined>>;
}

const SocketContext = React.createContext<SocketContextValue>(null as any);

const SocketContextProvider: React.FC = ({ children }) => {
    const [socket, setSocket] = useState<SocketIOClient.Socket>();

    return <SocketContext.Provider value={{ socket, setSocket } as any}>{children}</SocketContext.Provider>
}

const useSocket = (socket: any) => {
    const emit = (type: string, payload: any) => {
        console.log('*emit:', type, payload)
        if (!socket) {
            return;
        }

        socket.emit('emit', { type, payload })
    }

    return {
        emit
    }
}

export {
    SocketContext,
    SocketContextProvider,
    useSocket
}