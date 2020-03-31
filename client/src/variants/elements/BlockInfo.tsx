import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

import moment from 'moment';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {


    //@todo move to helpers
    const dateFormat = (date: Date, fmt = 'YYYY-MM-DD HH:mm:ss') => {
        if (!date) {
            date = new Date();
        }

        return `${moment(date).utc().format(fmt)} UTC`;
    };

    const options: BasicListOptions = {
        rows: [
            {
                key: 'height',
                title: 'Height',
                header: 'Block Info'
            },
            {
                key: 'confirmations',
                title: 'Confirmations'
            },
            {
                key: 'hash',
                title: 'Hash'
            },
            {
                key: 'difficulty',
                title: 'Difficulty'
            },
            {
                key: 'size',
                title: 'Size',
                format: (size: number) => `${(size / 1024).toFixed(2)} kB`
            },
            {
                key: 'date',
                title: 'Date',
                format: (date: Date) => dateFormat(date)
            },

        ],
        clickable: false
    }


    return <BasicList object={object} childrenIds={childrenIds} options={options} />
})

export default VariantBlocks