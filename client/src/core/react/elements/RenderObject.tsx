import React, { useContext } from 'react';
import { Box, Grid, Paper } from '@material-ui/core';

import { CarverUserContext } from '../contexts/CarverUser'
import { variantConfigurations, Configuration } from '../../../variants/configuration';

export interface RenderObjectParams {
    objectId: string;
}

const RenderObject: React.FC<RenderObjectParams> = ({ objectId }) => {
    const { state } = useContext(CarverUserContext);

    const childrenIds = state.children[objectId];
    const object = state.objects[objectId];

    const variantConfiguration = variantConfigurations.get(object.variant)
    if (!variantConfiguration) {
        return <Box>Unable to find variant: {object.variant}</Box>
    }

    const { gridBreakpoints } = variantConfiguration;

    return <Grid item {...gridBreakpoints}>
        <Paper>
            <Box p={1} m={1}>
                <variantConfiguration.element object={object} childrenIds={childrenIds} />
            </Box>
        </Paper>
    </Grid>
}

export {
    variantConfigurations,
    RenderObject
}