import React, { useContext } from 'react';
import { Drawer, makeStyles, createStyles, Theme, Hidden, useTheme, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';

import clsx from 'clsx';

import BlocksIcon from '@material-ui/icons/ViewComfyRounded';
import TransactionsIcon from '@material-ui/icons/TrendingFlatRounded';
import StatsIcon from '@material-ui/icons/MultilineChartRounded';
import { SocketContext } from '../contexts/Socket';

import { commonLanguage as carverUserCommonLanguage } from '../../carver/contexts/publicState/context'

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
        },
        drawer: {
            [theme.breakpoints.up('sm')]: {
                width: drawerWidth,
                flexShrink: 0,
            },
        },
        appBar: {
            [theme.breakpoints.up('sm')]: {
                width: `calc(100% - ${drawerWidth}px)`,
                marginLeft: drawerWidth,
            },
        },
        menuButton: {
            marginRight: theme.spacing(2),
            [theme.breakpoints.up('sm')]: {
                display: 'none',
            },
        },
        // necessary for content to be below app bar
        toolbar: theme.mixins.toolbar,
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
        },
        drawerPaper: {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        drawerPaperClose: {
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
            },
        },
        drawerRoot: {
            height: '100%'
        }
    }),
);

const MainDrawer: React.FC = ({ }) => {
    const { socket } = useContext(SocketContext)

    const classes = useStyles();

    const isDrawerOpen = true;

    const buttons = [
        {
            title: 'Blocks',
            icon: BlocksIcon,
            onClick: () => navigatePage('blocks')
        },
        {
            title: 'Transactions',
            icon: TransactionsIcon,
            onClick: () => navigatePage('transactions')
        },
        {
            title: 'Stats',
            icon: StatsIcon,
            onClick: () => navigatePage('stats')
        },
    ]

    const navigatePage = (page: string) => {
        socket.command({
            type: carverUserCommonLanguage.commands.Pages.Navigate,
            payload: {
                page
            }
        });
    }

    const drawer = (
        <>
            <div className={classes.toolbar} />
            <Divider />
            <List>
                {buttons.map((button) => (
                    <ListItem button key={button.title} onClick={button.onClick}>
                        <ListItemIcon><button.icon /></ListItemIcon>
                        <ListItemText primary={button.title} />
                    </ListItem>
                ))}
                <Divider />
            </List>
        </>
    );

    return <nav className={classes.drawer} aria-label="mailbox folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden lgUp>
            <Drawer
                variant="temporary"
                //open={mobileOpen}
                //onClose={handleDrawerToggle}
                classes={{
                    root: classes.drawerRoot,
                    paper: clsx(classes.drawerPaper, !isDrawerOpen && classes.drawerPaperClose),
                }}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                open={isDrawerOpen}
            >
                {drawer}
            </Drawer>
        </Hidden>
        <Hidden smDown>
            <Drawer
                classes={{
                    root: classes.drawerRoot,
                    paper: clsx(classes.drawerPaper, !isDrawerOpen && classes.drawerPaperClose),
                }}
                variant="permanent"
                open={isDrawerOpen}
            >
                {drawer}
            </Drawer>
        </Hidden>
    </nav>
}

export {
    MainDrawer
}