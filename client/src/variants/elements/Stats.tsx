import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

import moment from 'moment';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {

    const options: BasicListOptions = {
        rows: [
            {
                key: 'usersOnline',
                title: 'Users Online'
            }

        ],
        clickable: false
    }


    return <BasicList object={object} childrenIds={childrenIds} options={options} />
})

export default VariantBlocks