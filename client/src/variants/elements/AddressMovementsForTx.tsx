import React from 'react';
import { VariantProps } from '../configuration';
import { VariantCommonTable, VariantCommonTableOptions } from './common/Table'
import { Card, CardContent, Grid, Box } from '@material-ui/core';

const AddressMovements: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: VariantCommonTableOptions = {
        columns: [
            {
                key: 'label',
                title: 'Address'
            },
            {
                key: 'amount',
                title: 'Amount'
            }
        ],
        clickable: true
    }

    return <Grid container>
        <Grid item sm={6} component={Card}>
            <CardContent>
                <VariantCommonTable object={object} childrenIds={childrenIds} options={options} rowMap={(rows: any) => rows.from} />
            </CardContent>
        </Grid>
        <Grid item sm={6} component={Card}>
            <CardContent>
                <VariantCommonTable object={object} childrenIds={childrenIds} options={options} rowMap={(rows: any) => rows.to} />
            </CardContent>
        </Grid>
    </Grid>
})

export default AddressMovements