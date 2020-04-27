import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

import moment from 'moment';
import { Card, CardContent } from '@material-ui/core';

const VariantStats: React.FC<VariantProps> = React.memo(({ state }) => {

    const options: BasicListOptions = {
        rows: [
            {
                key: 'usersOnline',
                title: 'Users Online'
            },
            {
                key: 'pageNavigationsCount',
                title: 'Session Page Views'
            },
            {
                key: 'currentWidgetContextsCount',
                title: 'Current Active Widgets'
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

export default VariantStats