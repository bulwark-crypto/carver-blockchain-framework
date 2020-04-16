import React, { useEffect, useReducer, useContext } from 'react';
import { config } from '../../../config'
import { TextField, Box } from '@material-ui/core';

import { reducer as loggerReducer, initialState as loggerInitialState, commonLanguage as loggerCommonLanguage } from '../../carver/contexts/logger/context'

import { RenderObject } from './RenderObject'

import { initReservationService } from '../../carver/reservations'

import { SocketContext } from '../contexts/Socket';
import { CarverUserContext } from '../contexts/CarverUser';

import { commonLanguage as carverUserCommonLanguage } from '../../../core/carver/contexts/publicState/context'

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


            const { pathname } = window.location

            addLog('Connecting to reservation service...');
            const reservationResponse = await reservationService.getNewReservation()
            const { id } = reservationResponse;

            addLog(`Connecting to EventSource with reservation id: ${id}...`);
            const eventSource = reservationService.getEventSource(reservationResponse);

            addLog(`Binding EventSource with reservation id: ${id}...`);
            reservationService.bindReservation(id, eventSource);

            /**
             * Listen to page url changes (history back/forth) and pass path of new url back to server
             */
            const bindHistoryStateListener = () => {
                window.onpopstate = (event: any) => {
                    const { pathname } = window.location

                    reservationService.command({
                        type: carverUserCommonLanguage.commands.Pages.NavigateByPathname,
                        payload: {
                            pathname,
                            pushHistory: false // When PAGE_NAVIGATED event is called don't add new page to browser history
                        }
                    });
                }
            }
            bindHistoryStateListener();

            setSocket(reservationService);

            await reservationService.command({ id, type: carverUserCommonLanguage.commands.Initialize, payload: { id, pathname } })
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
        if (!carverUserState.widgets) {
            return <Box>Loading...</Box>
        }
        return <RenderObject state={carverUserState.widgets} variant={'widgetsContainer'} />;
    }

    return <>
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
    </>
}
export default RenderRootObject;