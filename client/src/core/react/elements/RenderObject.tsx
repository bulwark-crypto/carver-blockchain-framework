import React, { useContext } from 'react';
import { Box, Grid, Paper, Card, CardHeader, CardContent, CardActions, IconButton } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import { CarverUserContext } from '../contexts/CarverUser'
import { variantConfigurations, Configuration } from '../../../variants/configuration';

export interface RenderObjectParams {
    state: any;
    variant: string; //@todo right now we pass the variant key from configurations.ts. Perhaps it's better to pass the entire object instead for more customization
}

const RenderObject: React.FC<RenderObjectParams> = ({ state, variant }) => {

    const variantConfiguration = variantConfigurations.get(variant)
    if (!variantConfiguration) {
        return <Box>Unable to find variant: {variant}</Box>
    }

    const { gridBreakpoints } = variantConfiguration;

    const getWidgetContents = () => {

        return <variantConfiguration.element state={state} />
    }

    return <Grid item {...gridBreakpoints}>
        {getWidgetContents()}
    </Grid >
}

export {
    variantConfigurations,
    RenderObject
}