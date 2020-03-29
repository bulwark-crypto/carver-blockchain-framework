import React from 'react';
import { VariantProps } from '../configuration';
import { BasicList, BasicListOptions } from './common/BasicList'

const VariantBlocks: React.FC<VariantProps> = React.memo(({ object, childrenIds }) => {
    const options: BasicListOptions = {
        rows: [
            {
                key: 'height',
                title: 'Height'
            },
            {
                key: 'hash',
                title: 'Hash'
            }
        ],
        clickable: false
    }


    return <BasicList object={object} childrenIds={childrenIds} options={options} />
})

export default VariantBlocks