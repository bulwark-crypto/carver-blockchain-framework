import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'height',
                title: 'Block #'
            },
            {
                key: 'date',
                title: 'Date'
            },
            {
                key: 'hash',
                title: 'Hash'
            },
            {
                key: 'txsCount',
                title: 'Txs'
            },
            {
                key: 'moneysupply',
                title: 'Supply'
            },
        ],
        clickable: true
    }


    return <Card>
        <CardContent>
            <VariantCommonTable object={object} childrenIds={childrenIds} options={options} />
        </CardContent>
    </Card>
})

export default VariantBlocks