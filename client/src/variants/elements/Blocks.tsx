import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';
import dateFormat from '../helpers/dateFormat';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'date',
                title: 'Date',
                format: (row) => dateFormat({ date: row.date })
            },
            {
                key: 'height',
                title: 'Block #'
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
            <VariantCommonTable state={state} options={options} />
        </CardContent>
    </Card>
})

export default VariantBlocks