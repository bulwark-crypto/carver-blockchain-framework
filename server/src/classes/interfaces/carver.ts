//@todo a lot of these are old and unused. Remove unused ones (they were ported from Carver 1 & 2D)

/**
 * Enum of all possible Carver2D addresses. In carver, everything is a movement between two addresses. Money always flows in between two "carver addresses"
 **/
export const CarverAddressType = {
    Tx: 'TX',

    Address: 'ADDRESS',
    Coinbase: 'COINBASE',
    Zerocoin: 'ZEROCOIN',
    Burn: 'BURN',
    Fee: 'FEE',
    ProofOfStake: 'PROOF_OF_STAKE',
    Masternode: 'MASTERNODE',
    Governance: 'GOVERNANCE',
    RewardTx: 'REWARD_TX',
    PowRewards: 'POW_REWARDS',
    PosRewards: 'POS_REWARDS',
    MnRewards: 'MN_REWARDS',
    ProofOfWork: 'PROOF_OF_WORK',
    Premine: 'PREMINE'
}

/**
 * During syncing, identify what type of transaciton we're working with
 */
export const CarverTxType = {
    TransferOneToOne: 'TRANSFER_ONE_TO_ONE',  // Basic movement from one address to another
    TransferManyToOne: 'TRANSFER_MANY_TO_ONE', // Many addresses to one address (Fan In)
    TransferOneToMany: 'TRANSFER_ONE_TO_MANY', // One address to many addresses (Fan Out)
    TransferManyToMany: 'TRANSFER_MANY_TO_MANY', // One address to many addresses (Fan Out)

    ProofOfWork: 'PROOF_OF_WORK', // POW or POW+MN
    ProofOfStake: 'PROOF_OF_STAKE', // POS or POS+MN
    Zerocoin: 'ZEROCOIN', // > = 0 Send To Zerocoin, <0 = Spend Zerocoin
    Invalid: 'INVALID' // For invalid txs (such as 0 value POS)
}