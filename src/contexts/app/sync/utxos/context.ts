import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'

interface Utxo {
    label: string;
    height: number;
    amount: number;
    address: string;
}

/**
 * Extract utxos from a tx
 */
const withCommandParseTx: Reducer = ({ state, event }) => {
    const rpcTx = event.payload;

    //@todo these are not in payload
    const { txid, height, vout: vouts } = rpcTx;

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

    console.log('*** utxos', utxos);

    return withState(state)
    /*.emit(commonLanguage.events.TxParsed,
        {
            tx,
            block,
            utxos
        });*/

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
        TxParsed: 'TX_PARSED'
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