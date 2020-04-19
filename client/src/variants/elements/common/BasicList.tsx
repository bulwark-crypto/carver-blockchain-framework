import React, { useContext } from 'react';
import { TableCell, Box, TableContainer, TableHead, TablePagination, TableRow, Table, TableBody, TableFooter, ListItemText, ListItem, List, ListSubheader, Typography, Card, CardContent } from '@material-ui/core';

import { VariantProps } from '../../configuration';

export interface Row {
    key: string;
    title: string;
    format?: (data: any) => any;
    header?: string;
}
export interface BasicListOptions {
    rows: Row[];
    clickable: boolean;
}

const commonLanguage = {
    commands: {
        Select: 'SELECT',
        UpdatePage: 'UPDATE_PAGE',
        UpdateLimit: 'UPDATE_LIMIT'
    }
}
interface Props {
    state: any;
    options: BasicListOptions;
}
const BasicList: React.FC<Props> = React.memo(({ state, options }) => {
    const { rows } = options;

    const tableRows = rows.map((row: any) => {

        const value = row.format ? row.format(state) : state[row.key];

        const getHeader = () => {
            if (!row.header) {
                return null;
            }
            return <ListSubheader>{row.header}</ListSubheader>
        }

        return <div key={row.key}>
            {getHeader()}
            <ListItem>
                <ListItemText primary={row.title} secondary={value} />
            </ListItem>
        </div>
    });

    return <List>
        {tableRows}
    </List>

})

export {
    BasicList,
    commonLanguage
}