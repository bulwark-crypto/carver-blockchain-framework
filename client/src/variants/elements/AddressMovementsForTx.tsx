import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent, Grid, Box, makeStyles } from '@material-ui/core';
import { useSameCardHeightStyle } from '../../classes/sameCardHeightStyle';
import { coinFormat, CoinFormatType } from '../helpers/coinFormats';


const AddressMovements: React.FC<VariantProps> = React.memo(({ state, coin }) => {
    const sameCardHeightStyle = useSameCardHeightStyle();

    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'label',
                title: 'Address'
            },
            {
                key: 'amount',
                title: 'Amount',
                format: (row: any) => {
                    return coinFormat({
                        value: row.amount,
                        type: CoinFormatType.Amount,
                        coin
                    })
                }
            }
        ],
        clickable: true
    }

    return <Grid container alignItems="stretch" spacing={2}>
        <Grid item sm={6} lg={6} className={sameCardHeightStyle.gridItem}>
            <Card className={sameCardHeightStyle.card}>
                <CardContent>
                    <VariantCommonTable state={state} options={options} rowMap={(rows: any) => rows.from} />
                </CardContent>
            </Card>
        </Grid>
        <Grid item sm={6} lg={6} className={sameCardHeightStyle.gridItem}>
            <Card className={sameCardHeightStyle.card}>
                <CardContent>
                    <VariantCommonTable state={state} options={options} rowMap={(rows: any) => rows.to} />
                </CardContent>
            </Card>
        </Grid>
    </Grid>
})

export default AddressMovements