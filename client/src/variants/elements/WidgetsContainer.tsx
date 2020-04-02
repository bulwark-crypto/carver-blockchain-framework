import React, { useContext } from 'react';
import { RenderObject } from '../../core/react/elements/RenderObject';
import { VariantProps } from '../configuration'
import { Box, Grid, Button, Paper } from '@material-ui/core';

import { commonLanguage as carverUserCommonLanguage } from '../../core/carver/contexts/publicState/context'
import { SocketContext } from '../../core/react/contexts/Socket'

const WidgetTableDisplay: React.FC<VariantProps> = ({ childrenIds }) => {
    const { socket } = useContext(SocketContext)

    const addWidget = (variant: string) => {
        socket.command({
            type: carverUserCommonLanguage.commands.Widgets.Add,
            payload: {
                variant
            }
        });

    }
    const removeWidget = (id: number) => {
        socket.command({
            type: carverUserCommonLanguage.commands.Widgets.Remove,
            payload: {
                id
            }
        });
    }

    const renderWidgets = () => {
        if (!childrenIds) {
            return null;
        }

        return childrenIds.map((childId: any) => {
            return <RenderObject key={childId} objectId={childId} />
            {/*<Button variant="contained" onClick={() => removeWidget(childId)}>
                        Remove
                    </Button>*/}
        })
    }

    return <>
        <Box mb={3}>
            <Grid container>
                <Grid item>
                    <Button variant="contained" onClick={() => addWidget('blocks')}>
                        Add Blocks Widget
                    </Button>
                </Grid>
            </Grid>
        </Box>
        <Grid container spacing={1}>
            {renderWidgets()}
        </Grid>
    </>

}

export default WidgetTableDisplay