import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import dateFormat from '../helpers/dateFormat';

const AddressMovements: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'date',
                title: 'Date',
                format: (row) => dateFormat(row.date)
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
                        return `-${row.amountOut} / +${row.amountIn}`;
                    } else if (row.amountIn) {
                        return `+${row.amountIn}`;
                    } else if (row.amountOut) {
                        return `-${row.amountOut}`;
                    }
                }
            },
            {
                key: 'balance',
                title: 'Balance',
            }
        ],
        clickable: true
    }

    return <VariantCommonTable object={object} childrenIds={childrenIds} options={options} />
})

export default AddressMovements