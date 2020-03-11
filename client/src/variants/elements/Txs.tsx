import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'height',
                title: 'Height'
            },
            {
                key: 'txid',
                title: 'Transaction Hash'
            },
            {
                key: 'totalAmountOut',
                title: 'Amount'
            },
            {
                key: 'totalCountIn',
                title: 'In'
            },
            {
                key: 'totalCountOut',
                title: 'Out'
            },
            {
                key: 'date',
                title: 'Date'
            },
        ],
        clickable: true
    }


    return <VariantCommonTable object={object} childrenIds={childrenIds} options={options} />
})

export default VariantBlocks