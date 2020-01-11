import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { CarverTxType, CarverAddressType } from '../../../../classes/interfaces/carver'


/**
 * Is this a POS transaction?
 */
const isPosTx = (tx: any) => {

    return tx.vin.length === 1 &&
        tx.vin[0].txid !== undefined &&
        tx.vin[0].vout !== undefined &&
        tx.vout[0].value !== undefined &&
        tx.vout[0].value === 0 &&
        tx.vout[0].n === 0 &&
        tx.vout[0].scriptPubKey &&
        tx.vout[0].scriptPubKey.type === 'nonstandard';
}

/**
 * Analyze a tx and return raw CarverMovement object data (to be finalized after)
 */
const getRequiredMovements = (block: any, tx: any, utxos: any[]) => {
    let txType = null; // By default we don't know the tx type

    // We'll keep a tally of all inputs/outputs summed by address
    const consolidatedAddressAmounts = new Map();
    const addToAddress = (addressType: any, label: string, amount: number) => {
        if (!consolidatedAddressAmounts.has(label)) {
            consolidatedAddressAmounts.set(label, { label, addressType, amountIn: 0, amountOut: 0, amount: 0 });
        }

        let consolidatedAddressAmount = consolidatedAddressAmounts.get(label);
        consolidatedAddressAmount.amount += amount;

        if (amount < 0) {
            consolidatedAddressAmount.amountOut += -amount;
        }
        if (amount > 0) {
            consolidatedAddressAmount.amountIn += amount;
        }
    }

    // These address labels will be filled during vin/vout scan
    let posAddressLabel = null;
    let powAddressLabel = null;
    let mnAddressLabel = null;
    let zerocoinOutAmount = 0;


    for (const vin of tx.vin) {
        if (vin.value) {
            throw 'VIN WITH VALUE?'; //@todo convert to commonLanguage error
        }

        if (vin.coinbase) {
            if (tx.vin.length != 1) {
                console.log(tx);
                throw "COINBASE WITH >1 VIN?"; //@todo convert to commonLanguage error
            }

            // Identify that this is a POW or POW/MN tx
            txType = CarverTxType.ProofOfWork;
        } else if (vin.scriptSig && vin.scriptSig.asm == 'OP_ZEROCOINSPEND') {
            txType = CarverTxType.Zerocoin;
        } else if (vin.txid) {
            if (vin.vout === undefined) {
                console.log(vin);
                throw 'VIN TXID WITHOUT VOUT?'; //@todo convert to commonLanguage error
            }

            const utxoLabel = `${vin.txid}:${vin.vout}`;
            const vinUtxo = utxos.find((utxo: any) => utxo.label === utxoLabel);
            if (!vinUtxo) {
                console.log(utxos);
                throw `UTXO not found: ${utxoLabel}`; //@todo convert to commonLanguage error
            }
            addToAddress(CarverAddressType.Address, vinUtxo.addressLabel, -vinUtxo.amount);

            if (isPosTx(tx)) {
                txType = CarverTxType.ProofOfStake;
                posAddressLabel = vinUtxo.addressLabel;
            }
        } else {
            console.log(vin);
            throw 'UNSUPPORTED VIN (NOT COINBASE OR TX)'; //@todo convert to commonLanguage error
        }
    }

    for (let voutIndex = 0; voutIndex < tx.vout.length; voutIndex++) {
        const vout = tx.vout[voutIndex];
        //const label = `${rpctx.txid}:${vout.n}`; //use txid+vout as identifier for these transactions

        if (vout.scriptPubKey) {
            switch (vout.scriptPubKey.type) {
                case 'pubkey':
                case 'pubkeyhash':
                case 'scripthash':

                    const addresses = vout.scriptPubKey.addresses;
                    if (addresses.length !== 1) {
                        throw 'ONLY PUBKEYS WITH 1 ADDRESS ARE SUPPORTED FOR NOW'; //@todo convert to commonLanguage error
                    }
                    if (vout.value === undefined) {
                        console.log(vout);
                        console.log(tx);
                        throw 'VOUT WITHOUT VALUE?'; //@todo convert to commonLanguage error
                    }

                    const addressLabel = addresses[0];
                    addToAddress(CarverAddressType.Address, addressLabel, vout.value);

                    if (txType) {
                        switch (txType) {
                            case CarverTxType.ProofOfWork:
                                if (tx.vout.length === 1) {
                                    // Proof of Work Reward / Premine 
                                    powAddressLabel = addressLabel;
                                } else {
                                    if (voutIndex === tx.vout.length - 1) { // Assume last tx is always POW reward
                                        // Proof of Work Reward
                                        powAddressLabel = addressLabel;
                                    } else {
                                        // Masternode Reward / Governance 
                                        mnAddressLabel = addressLabel;
                                    }
                                }
                                break;
                            case CarverTxType.ProofOfStake:
                                if (voutIndex === tx.vout.length - 1) { // Assume last tx is always masternode reward
                                    // Masternode Reward / Governance 
                                    mnAddressLabel = addressLabel;
                                } else {
                                    // Proof of Stake Reward
                                    posAddressLabel = addressLabel;
                                }
                                break;
                            case CarverTxType.Zerocoin:
                                zerocoinOutAmount += vout.value;
                                break;
                            default:
                                console.log(txType);
                                throw 'Unhandled carverTxType!'; //@todo convert to commonLanguage error
                        }
                    }
                    if (vout.value > 0) {
                        utxos.push({
                            label: `${tx.txid}:${vout.n}`,
                            blockHeight: block.height,
                            amount: vout.value,
                            addressLabel
                        });
                    }
                    break;
                case 'nonstandard':
                    // Don't need to do any movements for this
                    break;
                case 'zerocoinmint':
                    {
                        if (vout.value === undefined) {
                            console.log(vout);
                            console.log(tx);
                            throw 'ZEROCOIN WITHOUT VALUE?'; //@todo convert to commonLanguage error
                        }
                        addToAddress(CarverAddressType.Zerocoin, 'ZEROCOIN', vout.value);
                    }
                    break
                case 'nulldata':
                    {
                        if (vout.value === undefined) {
                            console.log(vout);
                            console.log(tx);
                            throw 'BURN WITHOUT VALUE?'; //@todo convert to commonLanguage error
                        }
                        addToAddress(CarverAddressType.Burn, 'BURN', vout.value);
                    }
                    break
                default:
                    console.log(vout);
                    console.log(tx);
                    throw `UNSUPPORTED VOUT SCRIPTPUBKEY TYPE: ${vout.scriptPubKey.type}`; //@todo convert to commonLanguage error
            }
        } else {
            console.log(vout);
            throw `UNSUPPORTED VOUT!`; //@todo convert to commonLanguage error
        }
    }


    // If we haven't figured out what carver tx type this is yet then it's basic movements (we'll jsut need to figure out if it's one to one, one to many, many to one or many to many based on number of used from/to addresses)
    if (!txType) {

        // For now hardcode all addresses as many to many
        txType = CarverTxType.TransferManyToMany;
    }

    switch (txType) {
        case CarverTxType.ProofOfStake:
            const posAddressAmount = consolidatedAddressAmounts.get(posAddressLabel);
            if (!posAddressAmount) {
                throw 'POS reward not found?';
            }
            addToAddress(CarverAddressType.ProofOfStake, `${posAddressLabel}:POS`, -posAddressAmount.amount);
            break;
        case CarverTxType.ProofOfWork:
            const powRewardAmount = consolidatedAddressAmounts.get(powAddressLabel);
            if (!powRewardAmount) {
                throw 'POW reward not found?';
            }
            addToAddress(CarverAddressType.ProofOfWork, `${powAddressLabel}:POW`, -powRewardAmount.amount);
            break;
        case CarverTxType.TransferManyToMany:
            break;
        case CarverTxType.Zerocoin:
            addToAddress(CarverAddressType.Zerocoin, `ZEROCOIN`, -zerocoinOutAmount);
            break;
        default:
            console.log(txType);
            throw 'carverTxType not found'
    }

    if (txType === CarverTxType.ProofOfStake || txType === CarverTxType.ProofOfWork) {
        if (mnAddressLabel) {
            const mnRewardAmount = consolidatedAddressAmounts.get(mnAddressLabel);
            if (!mnRewardAmount) {
                throw 'MN reward not found?';
            }
            addToAddress(CarverAddressType.Masternode, `${mnAddressLabel}:MN`, -mnRewardAmount.amount);
        }
    }


    const consolidatedAddresses = Array.from(consolidatedAddressAmounts.values());

    // Finally create our new movement
    const totalAmountIn = consolidatedAddresses.reduce((total, consolidatedAddressAmount) => total + consolidatedAddressAmount.amountIn, 0);
    const totalAmountOut = consolidatedAddresses.reduce((total, consolidatedAddressAmount) => total + consolidatedAddressAmount.amountOut, 0);
    return {
        txType,
        totalAmountIn,
        totalAmountOut,
        consolidatedAddressAmounts
    }
}

/**
 * Add new txs to fetch
 */
const withCommandParseTx: Reducer = ({ state, event }) => {
    const { rpcTx, rpcBlock, utxos } = event.payload;

    const requiredMovements = getRequiredMovements(rpcBlock, rpcTx, utxos);

    //console.log('parse tx!', requiredMovements);

    return withState(state)
    /*.emit({
        type: commonLanguage.events.TxParsed,
        payload: requiredMovements
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