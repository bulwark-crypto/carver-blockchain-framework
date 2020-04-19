import React, { useContext } from 'react';
import { Box, Grid, Paper, Card, CardHeader, CardContent, CardActions, IconButton } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import { CarverUserContext } from '../contexts/CarverUser'
import { variantConfigurations, Configuration } from '../../../variants/configuration';
import { Coin } from '../../carver/sharedInterfaces';

export interface RenderObjectParams {
    state: any;
    variant: string;

    /**
     * All variants have access to the currently selected coin
     */
    coin: Coin;
}

const RenderObject: React.FC<RenderObjectParams> = ({ state, variant, coin }) => {

    const variantConfiguration = variantConfigurations.get(variant)
    if (!variantConfiguration) {
        return <Box>Unable to find variant: {variant}</Box>
    }

    const { gridBreakpoints } = variantConfiguration;

    const getWidgetContents = () => {

        return <variantConfiguration.element state={state} coin={coin} />
    }

    return <Grid item {...gridBreakpoints}>
        {getWidgetContents()}
    </Grid >
}

export {
    variantConfigurations,
    RenderObject
}