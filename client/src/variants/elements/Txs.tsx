import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state }) => {
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


    return <Card>
        <CardContent>
            <VariantCommonTable state={state} options={options} />
        </CardContent>
    </Card>
})

export default VariantBlocks