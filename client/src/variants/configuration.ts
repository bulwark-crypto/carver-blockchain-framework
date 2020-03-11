
import WidgetsContainerElement from './elements/WidgetsContainer'
import BlocksElement from './elements/Blocks'
import TxsElement from './elements/Txs'

export interface VariantProps {
    object: any;
    childrenIds: string[];
}
export interface Configuration {
    variant: string;
    title: string;
    description?: string;
    element: React.FC<VariantProps>;
    options?: any;
}
const variantConfigurations = {

    widgetsContainer: {
        title: 'Widgets Container',
        description: 'This variant contains a set of widgets. Children of this object are further rendered as variants',

        element: WidgetsContainerElement,
    } as Configuration,

    blocks: {
        title: 'Blocks',
        description: 'List of most recent blockchain blocks.',

        element: BlocksElement
    } as Configuration,

    txs: {
        title: 'Transactions',
        description: 'List of most recent blockchain transactions. Can specify additional filter for txs of a specific block.',

        element: TxsElement
    } as Configuration,
}

export { variantConfigurations }