import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

import moment from 'moment';
import { Card, CardContent } from '@material-ui/core';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ state }) => {

    const options: BasicListOptions = {
        rows: [
            {
                key: 'usersOnline',
                title: 'Users Online'
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

export default VariantBlocks