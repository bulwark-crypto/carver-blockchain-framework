import { Context } from '../../../../classes/interfaces/context'
import { withState, Reducer } from '../../../../classes/logic/withState'
import { CarverTxType, CarverAddressType } from '../../../../classes/interfaces/carver'
import { isPosTx, isEmptyNonstandardTx } from '../../../../classes/logic/txUtils'

const getVinUtxoLabels = (rpcTx: any) => {
    const utxoLabels = [];

    for (let vinIndex = 0; vinIndex < rpcTx.vin.length; vinIndex++) {
        const vin = rpcTx.vin[vinIndex];

        // Zerocoin doesn't need any vins
        if (vin.scriptSig && vin.scriptSig.asm == 'OP_ZEROCOINSPEND') {
            return utxoLabels;
        }

        if (vin.txid) {
            if (vin.vout === undefined) {
                console.log(vin);
                throw 'VIN TXID WITHOUT VOUT?';
            }

            const label = `${vin.txid}:${vin.vout}`;
            utxoLabels.push(label);
        }
    }

    return utxoLabels;
}

/**
 * Analyze a tx and return raw CarverMovement object data (to be finalized after)
 */
const getRequiredMovements = (tx: any, utxos: any[]) => {

    /**
     * Zero POS txs do not require any movements, mark them as invalid txs.
     */
    if (isEmptyNonstandardTx(tx)) {
        return {
            txid: tx.txid,
            txType: CarverTxType.Invalid,
            totalAmountIn: 0,
            totalAmountOut: 0,
            consolidatedAddressAmounts: [] as any[]
        }
    }

    let txType = null; // By default we don't know the tx type

    // We'll keep a tally of all inputs/outputs summed by address
    const consolidatedAddressAmounts = new Map();
    const addToAddress = (addressType: any, label: string, amount: number) => {
        if (!label) {
            throw `Invalid label: ${label} ${addressType}`
        }
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
                console.log(utxos, tx.txid);
                throw `UTXO not found: ${utxoLabel}`; //@todo convert to commonLanguage error
            }
            addToAddress(CarverAddressType.Address, vinUtxo.address, -vinUtxo.amount);

            if (isPosTx(tx)) {
                txType = CarverTxType.ProofOfStake;
                posAddressLabel = vinUtxo.address;
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
                            height: tx.height,
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

    const consolidatedAddresses = Array.from(consolidatedAddressAmounts.values());

    const totalCountOut = consolidatedAddresses.filter(consolidatedAddressAmount => consolidatedAddressAmount.amountOut > 0).length;
    const totalCountIn = consolidatedAddresses.filter(consolidatedAddressAmount => consolidatedAddressAmount.amountIn > 0).length;

    // If we haven't figured out what carver tx type this is yet then it's basic movements (we'll jsut need to figure out if it's one to one, one to many, many to one or many to many based on number of used from/to addresses)
    if (!txType) {
        if (totalCountIn === 1 && totalCountOut === 1) {
            txType = CarverTxType.TransferOneToOne;
        } else if (totalCountIn === 1 && totalCountOut > 1) {
            txType = CarverTxType.TransferOneToMany;
        } else if (totalCountIn > 1 && totalCountOut === 1) {
            txType = CarverTxType.TransferManyToOne;
        } else if (totalCountIn > 1 && totalCountOut > 1) {
            txType = CarverTxType.TransferManyToMany;
        }
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
        case CarverTxType.Zerocoin:
            addToAddress(CarverAddressType.Zerocoin, `ZEROCOIN`, -zerocoinOutAmount);
            break;
        case CarverTxType.TransferManyToMany:
        case CarverTxType.TransferManyToOne:
        case CarverTxType.TransferOneToMany:
        case CarverTxType.TransferOneToOne:
            break;
        default:
            console.log(txType);
            throw 'carverTxType not found'
    }

    const isReward = txType === CarverTxType.ProofOfStake || txType === CarverTxType.ProofOfWork;
    if (isReward) {
        if (mnAddressLabel) {
            const mnRewardAmount = consolidatedAddressAmounts.get(mnAddressLabel);
            if (!mnRewardAmount) {
                throw 'MN reward not found?';
            }
            addToAddress(CarverAddressType.Masternode, `${mnAddressLabel}:MN`, -mnRewardAmount.amount);
        }
    }


    // Finally create our new movement
    const totalAmountIn = consolidatedAddresses.reduce((total, consolidatedAddressAmount) => total + consolidatedAddressAmount.amountIn, 0);
    const totalAmountOut = consolidatedAddresses.reduce((total, consolidatedAddressAmount) => total + consolidatedAddressAmount.amountOut, 0);


    const { height, time, txid } = tx;
    const date = new Date(time * 1000);

    return {
        txid,
        date,
        txType,
        totalAmountIn,
        totalAmountOut,
        totalCountIn,
        totalCountOut,
        consolidatedAddressAmounts: Array.from(consolidatedAddressAmounts.values()),
        isReward,
        height
    }
}

/**
 * Add new txs to fetch
 */
const withCommandParseTx: Reducer = ({ state, event }) => {
    const { rpcTx, utxos } = event.payload;


    const txid = rpcTx.txid;

    const utxoLabels = getVinUtxoLabels(rpcTx);

    return withState(state)
        .query(commonLanguage.queries.GetUtxosForTx, {
            txid,
            rpcTx,
            utxoLabels,
            sequence: event.sequence
        })
}

const withQueryGetUtxosForTx: Reducer = ({ state, event }) => {
    const { rpcTx, utxos, sequence } = event.payload;

    const { height } = rpcTx;

    const requiredMovements = getRequiredMovements(rpcTx, utxos);

    const { isReward } = requiredMovements;

    return withState(state)
        .store(commonLanguage.storage.InsertOne, {
            ...requiredMovements,
            sequence
        })
        .set({
            height,
            rewardsCount: isReward ? state.rewardsCount + 1 : state.rewardsCount,
            nonRewardsCount: !isReward ? state.nonRewardsCount + 1 : state.nonRewardsCount,
        })
        .emit({
            type: commonLanguage.events.TxParsed,
            payload: rpcTx.txid
        });
}
const withCommandInitialize: Reducer = ({ state, event }) => {
    const { height, rewardsCount, nonRewardsCount } = event.payload;

    return withState(state).set({
        height,
        rewardsCount,
        nonRewardsCount
    })
}

const reducer: Reducer = ({ state, event }) => {
    return withState(state)

        .reduce({ type: commonLanguage.commands.Initialize, event, callback: withCommandInitialize })
        .reduce({ type: commonLanguage.queries.GetUtxosForTx, event, callback: withQueryGetUtxosForTx })
        .reduce({ type: commonLanguage.commands.ParseTx, event, callback: withCommandParseTx });
}

const commonLanguage = {
    commands: {
        ParseTx: 'PARSE_TX',
        Initialize: 'INITIALIZE'
    },
    events: {
        TxParsed: 'TX_PARSED'
    },
    queries: {
        GetUtxosForTx: 'GET_UTXOS_FOR_TX'
    },
    storage: {
        InsertOne: 'INSERT_ONE',
        FindOneByTxId: 'FIND_ONE_BY_TXID',

        FindManyByPage: 'FIND_MANY_BY_PAGE',
        FindCount: 'FIND_COUNT'
    },
    errors: {
        heightMustBeSequential: 'Blocks must be sent in sequential order',
        unableToFetchTx: 'Unable to fetch TX',
        noTxVout: 'Unsupported transaction. (No vout[]).'
    }
}

const initialState = {
    height: 0,
    txsQueue: [] as any[],
    rewardsCount: 0,
    nonRewardsCount: 0
}

export default {
    initialState,
    reducer,
    commonLanguage
}