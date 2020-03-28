import React, { useEffect, useReducer, useContext } from 'react';
import { TextField } from '@material-ui/core';

import { reducer as loggerReducer, initialState as loggerInitialState } from '../../carver/contexts/logger/context'

const RenderRootObject: React.FC = () => {
    const [loggerState] = useReducer(loggerReducer, loggerInitialState); //@todo move to it's own context


    return <TextField
        label="Debug Log"
        fullWidth={true}
        multiline={true}
        value={loggerState.textLog}
        InputProps={{
            readOnly: true,
        }}
    />
}
export default RenderRootObject;