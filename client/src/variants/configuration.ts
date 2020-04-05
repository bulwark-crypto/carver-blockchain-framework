
import WidgetsContainerElement from './elements/WidgetsContainer'
import BlocksElement from './elements/Blocks'
import BlockInfoElement from './elements/BlockInfo'
import StatsElement from './elements/Stats'
import TxsElement from './elements/Txs'
import TxElement from './elements/Tx'
import AddressMovementsForTxElement from './elements/AddressMovementsForTx'
import AddressMovementsForAddressElement from './elements/AddressMovementsForAddress'

export interface VariantProps {
    object: any;
    childrenIds: string[];
}
export interface Configuration {
    title: string;
    description?: string;
    element: React.FC<VariantProps>;
    options?: any;
    gridBreakpoints?: any;
}
const variants = {

    widgetsContainer: {
        title: 'Widgets Container',
        description: 'This variant contains a set of widgets. Children of this object are further rendered as variants',

        element: WidgetsContainerElement,
        gridBreakpoints: { xs: 12 }
    },

    blocks: {
        title: 'Blocks',
        description: 'List of most recent blockchain blocks.',

        element: BlocksElement,
        gridBreakpoints: { xs: 12 }
    },

    txs: {
        title: 'Transactions',
        description: 'List of most recent blockchain transactions. Can specify additional filter for txs of a specific block.',

        element: TxsElement,
        gridBreakpoints: { xs: 12 }
    },

    blockInfo: {
        title: 'Block Info',
        description: 'Gets details for a specific block height',

        element: BlockInfoElement,
        gridBreakpoints: { xs: 12 }
    },

    tx: {
        title: 'Transaction Details',
        description: 'Get details of a transaction',

        element: TxElement,
        gridBreakpoints: { xs: 12 }
    },

    stats: {
        title: 'Stats',
        description: 'Gets detailed information of current state of the network',

        element: StatsElement,
        gridBreakpoints: { xs: 12 }
    },

    addressMovementsForTx: {
        title: 'Address Movements (By Tx)',
        description: 'Shows a list of addresses where funds moved from/to.',

        element: AddressMovementsForTxElement,
        gridBreakpoints: { xs: 6 }
    },

    addressMovementsForAddress: {
        title: 'Address Movements (By Address)',
        description: 'Shows a list of running balance for a specific address',

        element: AddressMovementsForAddressElement,
        gridBreakpoints: { xs: 12 }
    },

}
const variantConfigurations = new Map<string, Configuration>(Object.entries(variants));

export { variantConfigurations }