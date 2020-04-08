import { makeStyles } from "@material-ui/core";

const useSameCardHeightStyle = makeStyles(theme => ({
    card: {
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'column',
        width: '100%'
    },
    gridItem: {
        display: 'flex'
    }
}));

export {
    useSameCardHeightStyle
}