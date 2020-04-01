import React, { useContext } from 'react';
import { Box, Grid, Paper, Card, CardHeader, CardContent, CardActions, IconButton } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';

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
        <Card>

            <CardContent>
                <variantConfiguration.element object={object} childrenIds={childrenIds} />
            </CardContent>
        </Card>
    </Grid >
}

export {
    variantConfigurations,
    RenderObject
}