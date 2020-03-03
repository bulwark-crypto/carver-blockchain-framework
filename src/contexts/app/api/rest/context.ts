import { withState, Reducer } from '../../../../classes/logic/withState'

const withCommandReserveSocket: Reducer = ({ state, event }) => {
    const params = event.payload
    console.log('** Reserve socket:', params);

    return withState(state)
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ReserveSocket, event, callback: withCommandReserveSocket })
}

const commonLanguage = {
    type: 'API_REST',
    commands: {
        ReserveSocket: 'RESERVE_SOCKET'
    }
}

const initialState = {}

export default {
    initialState,
    reducer,
    commonLanguage
}