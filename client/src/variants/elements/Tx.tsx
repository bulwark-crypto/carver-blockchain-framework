import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'
import { Card, CardContent } from '@material-ui/core';
import dateFormat from '../helpers/dateFormat';

const VariantTx: React.FC<VariantProps> = React.memo(({ state }) => {

    const options: BasicListOptions = {
        rows: [
            {
                key: 'date',
                title: 'Date',
                format: (row) => dateFormat({ date: row.date })
            },
            {
                key: 'confirmations',
                title: 'Confirmations'
            },
            {
                key: 'txid',
                title: 'Transaction Hash',
            },
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