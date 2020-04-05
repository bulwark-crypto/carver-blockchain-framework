import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'
import dateFormat from '../helpers/dateFormat';

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
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


    return <BasicList object={object} childrenIds={childrenIds} options={options} />
})

export default VariantBlocks