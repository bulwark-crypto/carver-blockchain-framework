import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent } from '@material-ui/core';
import dateFormat from '../helpers/dateFormat';

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

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state }) => {
    const { mapType }: { mapType: MapType } = state

    const getColumns = () => {
        switch (mapType) {
            case MapType.Transactions:
                return [
                    {
                        key: 'date',
                        title: 'Date',
                        format: (row: any) => dateFormat({ date: row.date })
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
                        key: 'totalAmountOut',
                        title: 'Amount'
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
                        title: 'Amount'
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