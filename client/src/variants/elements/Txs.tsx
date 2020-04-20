import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';
import dateFormat from '../helpers/dateFormat';
import { coinFormat, CoinFormatType } from '../helpers/coinFormats';

/**
 * [Shared] We'll ask for some data, how will it be mapped back in the response?
 */
enum MapType {
    /**
     * These transactions are displayed on "/blocks/XXXXX"
     */
    Block,
    /**
     * These transactions are displayed on "/transactions"
     */
    Transactions
}

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state, coin }) => {
    const { mapType }: { mapType: MapType } = state

    const getColumns = () => {
        // Txs can be represented in few different views. Each view will be focused around a specific area and some columns will be visible/hidden.
        // Note that the other columns are not passed in the variant data as the logic is shared.
        switch (mapType) {
            case MapType.Transactions:
                return [
                    {
                        key: 'date',
                        title: 'Date',
                        format: (row: any) => dateFormat({ date: row.date, hideAgo: true })
                    },
                    {
                        key: 'height',
                        title: 'Block #'
                    },
                    {
                        key: 'txid',
                        title: 'Transaction Hash'
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
                        key: 'totalAmountIn',
                        title: 'Amount',
                        format: (row: any) => {
                            return coinFormat({
                                value: row.totalAmountIn,
                                type: CoinFormatType.Amount,
                                coin
                            })
                        }
                    },
                ]
            case MapType.Block:
                return [
                    {
                        key: 'txid',
                        title: 'Transaction Hash'
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
                        key: 'totalAmountIn',
                        title: 'Amount',
                        format: (row: any) => {
                            return coinFormat({
                                value: row.totalAmountIn,
                                type: CoinFormatType.Amount,
                                coin
                            })
                        }
                    }
                ]
        }

    }

    const columns = getColumns()

    const options: VariantCommonTableOptions = {
        columns,
        clickable: true
    }


    return <Card>
        <CardContent>
            <VariantCommonTable state={state} options={options} />
        </CardContent>
    </Card>
})

export default VariantBlocks