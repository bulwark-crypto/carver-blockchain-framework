import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button, AppBar, Toolbar, IconButton, makeStyles, Box, Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import MenuIcon from '@material-ui/icons/Menu';
import BrushIcon from '@material-ui/icons/Brush';
import BuildIcon from '@material-ui/icons/Build';

const drawerWidth = 230;

const useStyles = makeStyles(theme => ({
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    bulwarkLogo: {
        fontSize: 35,
        verticalAlign: "middle",
    },
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px 0 16px',
        ...theme.mixins.toolbar,
    },
    appBar: {
        backgroundColor: theme.palette.type == 'dark' ? '#2c3f91' : theme.palette.primary.main,
        color: '#fff',
        zIndex: theme.zIndex.drawer + 1000,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),

    },
    menuButton: {
        marginRight: 16,
    },
    menuButtonHidden: {
        display: 'none',
    },
    title: {
        flexGrow: 1,
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
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    },
    fixedHeight: {
        height: 240,
    },
    myNodeCount: {
        color: theme.palette.secondary.light
    },
    statusIconFailure: {
        fontSize: 24,
        verticalAlign: "middle",
        color: theme.palette.error.main,
        float: "right"
    },
}));

interface INavProps {
    sidebar: boolean;
}

const MainAppBar: React.FC<INavProps> = ({ sidebar }) => {
    const classes = useStyles();

    const userSessionState = {
        isDrawerOpen: false,
        isLoggedIn: false,
        balance: 0,
        usdBalance: 0,
        theme: 'BulwarkThemeDark'
    }


    return <AppBar position="absolute" className={clsx(classes.appBar)}>
        <Toolbar className={classes.toolbar}>
            {sidebar && (
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="Open drawer"
                    //onClick={userSessionActions.drawerOpen}
                    className={clsx(classes.menuButton, userSessionState.isDrawerOpen && classes.menuButtonHidden)}
                >
                    <MenuIcon />
                </IconButton>
            )}
            <Box display={{ xs: 'none', sm: 'block' }} mr={1}><BrushIcon className={classes.bulwarkLogo} /></Box>
            <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                <Box display={{ xs: 'none', md: 'inline-block' }}>
                    Carver Framework
            </Box>
                <Box display={{ xs: 'none', sm: 'inline-block', md: 'none' }}>
                    Carver Framework
            </Box>
                <Box component="span" ml={1} display={{ xs: 'none', md: 'inline-block' }}><Typography component="span" color="secondary">(Beta)</Typography></Box>
            </Typography>
            <Tooltip title="Toggle Dark Theme"><IconButton color='inherit' /*onClick={userSessionActions.toggleTheme}*/>
                <BuildIcon />
            </IconButton></Tooltip>
            {userSessionState.isLoggedIn && <Button color='inherit'/* onClick={() => userSessionActions.userExit()}*/>Log Out</Button>}
            {!userSessionState.isLoggedIn && <Button color='inherit'>Log In</Button>}
        </Toolbar>
    </AppBar>
}

export default MainAppBar