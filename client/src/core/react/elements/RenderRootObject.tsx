import React, { useEffect, useReducer, useContext } from 'react';
import { config } from '../../../config'
import { TextField, Box } from '@material-ui/core';

import { reducer as loggerReducer, initialState as loggerInitialState, commonLanguage as loggerCommonLanguage } from '../../carver/contexts/logger/context'

import { RenderObject } from './RenderObject'

import { initReservationService } from '../../carver/reservations'

import { SocketContext } from '../contexts/Socket';
import { CarverUserContext } from '../contexts/CarverUser';

const RenderRootObject: React.FC = () => {
    const { state: carverUserState, dispatch: carverUserDispatch } = useContext(CarverUserContext)
    const { setSocket } = useContext(SocketContext)
    const [loggerState, loggerDispatch] = useReducer(loggerReducer, loggerInitialState); //@todo move to it's own context

    const addLog = (...args: any) => {
        loggerDispatch({ type: loggerCommonLanguage.commands.Add, payload: args });
    }

    const initConnection = async () => {
        try {
            //@todo we don't need this initializer. We need to create contextStore and then access these contexts internally
            //For now this is a decent shortcut until we figure out what other contexts there are on frontend
            const reservationService = initReservationService({
                loggerDispatch,
                carverUserDispatch
            })


            addLog('Connecting to reservation service...');
            const reservationResponse = await reservationService.getNewReservation()
            const { id } = reservationResponse;

            addLog(`Connecting to EventSource with reservation id: ${id}...`);
            const eventSource = reservationService.getEventSource(reservationResponse);

            //setSocket(socket);

            addLog(`Binding EventSource with reservation id: ${id}...`);
            reservationService.bindReservation(eventSource);

            await reservationService.command(id, 'INITIALIZE')
        } catch (err) {
            // @todo Proper error handling. World's greatest error handling right here.
            console.log(err);
            addLog(err);
        }
    }


    useEffect(() => {
        addLog(`Starting Carver Blockchain Framework (Version ${config.version})...`);
        initConnection();
    }, [])

    const renderRootObject = () => {
        const { rootId } = carverUserState;

        if (!rootId) {
            return <Box>Loading...</Box>
        }
        return <RenderObject objectId={rootId} />;
    }

    return <Box p={2}>
        {renderRootObject()}
        <TextField
            label="Debug Log"
            fullWidth={true}
            multiline={true}
            value={loggerState.textLog}
            InputProps={{
                readOnly: true,
            }}
        />
    </Box>
}
export default RenderRootObject;