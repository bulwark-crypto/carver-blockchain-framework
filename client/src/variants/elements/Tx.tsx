import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'
import { Card, CardContent } from '@material-ui/core';

const VariantTx: React.FC<VariantProps> = React.memo(({ state }) => {

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


    return <Card>
        <CardContent>
            <BasicList state={state} options={options} />
        </CardContent>
    </Card>
})

export default VariantTx