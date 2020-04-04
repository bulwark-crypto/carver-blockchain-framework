import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'

const AddressMovements: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'label',
                title: 'Address'
            },
            {
                key: 'amount',
                title: 'Amount'
            }
        ],
        clickable: true
    }


    return <VariantCommonTable object={object} childrenIds={childrenIds} options={options} />
})

export default AddressMovements