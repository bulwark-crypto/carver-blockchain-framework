import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'
import dateFormat from '../helpers/dateFormat';
import { Grid, Card, CardContent } from '@material-ui/core';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state }) => {
    const leftOptions: BasicListOptions = {
        rows: [
            {
                key: 'height',
                title: 'Height',
            },
            {
                key: 'confirmations',
                title: 'Confirmations'
            },
            {
                key: 'hash',
                title: 'Hash'
            }
        ],
        clickable: false
    }
    const rightOptions: BasicListOptions = {
        rows: [
            {
                key: 'difficulty',
                title: 'Difficulty'
            },
            {
                key: 'size',
                title: 'Size',
                format: (row) => {
                    return `${(row.size / 1024).toFixed(2)} kB`;
                }
            },
            {
                key: 'date',
                title: 'Date',
                format: (row) => dateFormat(row.date)
            },

        ],
        clickable: false
    }


    return <Grid container spacing={2}>
        <Grid item sm={6}>
            <Card>
                <CardContent>
                    <BasicList state={state} options={leftOptions} />
                </CardContent>
            </Card>
        </Grid>
        <Grid item sm={6}>
            <Card>
                <CardContent>
                    <BasicList state={state} options={rightOptions} />
                </CardContent>
            </Card>
        </Grid>
    </Grid>
})

export default VariantBlocks