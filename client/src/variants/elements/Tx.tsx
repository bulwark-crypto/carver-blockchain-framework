import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

const VariantTx: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {

    const options: BasicListOptions = {
        rows: [
            {
                key: 'txid',
                title: 'Transaction Hash',
            },
            {
                key: 'confirmations',
                title: 'Confirmations'
            },
            {
                key: 'time',
                title: 'time'
            }
        ],
        clickable: false
    }


    return <BasicList object={object} childrenIds={childrenIds} options={options} />
})

export default VariantTx