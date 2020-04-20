import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import dateFormat from '../helpers/dateFormat';
import { Box, Card, CardContent } from '@material-ui/core';
import { coinFormat, CoinFormatType } from '../helpers/coinFormats';

const AddressMovements: React.FC<VariantProps> = React.memo(({ state, coin }) => {
    const formatAmount = (value: number) => {
        return coinFormat({
            value,
            type: CoinFormatType.Amount,
            coin
        })
    }
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'date',
                title: 'Date',
                format: (row) => dateFormat({ date: row.date })
            },
            {
                key: 'txid',
                title: 'Transaction Hash'
            },
            {
                key: 'amount',
                title: 'Amount',
                format: (row) => {
                    if (row.amountIn && row.AmountOut) {
                        return `-${formatAmount(row.amountOut)} / +${formatAmount(row.amountIn)}`;
                    } else if (row.amountIn) {
                        return `+${formatAmount(row.amountIn)}`;
                    } else if (row.amountOut) {
                        return `-${formatAmount(row.amountOut)}`;
                    }
                }
            },
            {
                key: 'balance',
                title: 'Balance',
                format: (row) => {
                    return formatAmount(row.balance);
                }
            }
        ],
        clickable: true
    }

    return <Card>
        <CardContent>
            <VariantCommonTable state={state} options={options} />
        </CardContent>
    </Card>
})

export default AddressMovements