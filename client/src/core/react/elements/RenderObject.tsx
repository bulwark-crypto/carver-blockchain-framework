import React, { useContext } from 'react';
import { Box } from '@material-ui/core';

import { CarverUserContext } from '../contexts/CarverUser'
import { variantConfigurations, Configuration } from '../../../variants/configuration';

export interface RenderObjectParams {
    objectId: string;
}

const RenderObject: React.FC<RenderObjectParams> = ({ objectId }) => {
    const { state } = useContext(CarverUserContext);


    const childrenIds = state.children[objectId];
    const object = state.objects[objectId];

    const variantConfiguration = (variantConfigurations as any)[object.variant] as Configuration;
    if (!variantConfiguration) {
        return <Box>Unable to find variant: {object.variant}</Box>
    }

    return <variantConfiguration.element object={object} childrenIds={childrenIds} />
}

export {
    variantConfigurations,
    RenderObject
}