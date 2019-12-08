import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

interface Utxo {
    label: string;
    height: number;
    amount: number;
    address: string;
}
/**
 * Add new txs to fetch
 */
const withCommandParseTx: Reducer = ({ state, event }) => {
    const tx = event.payload;

    const { height, txid, vout: vouts } = event.payload;
    if (!vouts) {
        throw commonLanguage.errors.noTxVout;
    }

    const utxos: Utxo[] = [];
    vouts.forEach((vout: any) => {
        if (vout.scriptPubKey) {
            switch (vout.scriptPubKey.type) {
                case 'pubkey':
                case 'pubkeyhash':
                case 'scripthash':

                    const addresses = vout.scriptPubKey.addresses;
                    if (addresses.length !== 1) {
                        throw 'ONLY PUBKEYS WITH 1 ADDRESS ARE SUPPORTED FOR NOW';
                    }
                    if (vout.value === undefined) {
                        console.log(vout);
                        console.log(tx);
                        throw 'VOUT WITHOUT VALUE?';
                    }

                    const address = addresses[0];
                    const label = `${txid}:${vout.n}`;

                    utxos.push({
                        label,
                        height,
                        amount: vout.value,
                        address
                    })
            }
        }
    });

    return withState(state)
        .emit(commonLanguage.events.New, utxos);

}
const reducer: Reducer = ({ state, event }) => {
    return withState(state)
        .reduce({ type: commonLanguage.commands.ParseTx, event, callback: withCommandParseTx });
}

const commonLanguage = {
    commands: {
        ParseTx: 'PARSE_TX'
    },
    events: {
        New: 'NEW'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order',
        unableToFetchTx: 'Unable to fetch TX',
        noTxVout: 'Unsupported transaction. (No vout[]).'
    }
}

const initialState = {
    height: 0,
    txsQueue: [] as any[]
}

export default {
    initialState,
    reducer,
    commonLanguage
}