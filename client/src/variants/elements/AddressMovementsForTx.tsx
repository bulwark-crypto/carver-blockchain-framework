import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';

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

    return <Card>
        <CardContent>
            <VariantCommonTable object={object} childrenIds={childrenIds} options={options} />
        </CardContent>
    </Card>
})

export default AddressMovements