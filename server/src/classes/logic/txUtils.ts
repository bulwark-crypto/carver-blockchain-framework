/**
 * Is this a 0 coin transaction from coinbase into nonstandard output? (0 POS txs)
 */
const isEmptyNonstandardTx = (rpcTx: any) => {
    return rpcTx.vin.length === 1 &&
        rpcTx.vin[0].coinbase &&
        rpcTx.vout.length === 1 &&
        rpcTx.vout[0].value === 0 &&
        rpcTx.vout[0].n === 0 &&
        rpcTx.vout[0].scriptPubKey &&
        rpcTx.vout[0].scriptPubKey.type === 'nonstandard';
}

/**
 * Is this a POS transaction?
 */
const isPosTx = (rpcTx: any) => {
    return rpcTx.vin.length === 1 &&
        rpcTx.vin[0].txid !== undefined &&
        rpcTx.vin[0].vout !== undefined &&
        rpcTx.vout[0].value !== undefined &&
        rpcTx.vout[0].value === 0 &&
        rpcTx.vout[0].n === 0 &&
        rpcTx.vout[0].scriptPubKey &&
        rpcTx.vout[0].scriptPubKey.type === 'nonstandard';
}

export {
    isEmptyNonstandardTx,
    isPosTx
}