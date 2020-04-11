import { makeStyles } from "@material-ui/core";

const useTableStyle = makeStyles(theme => ({
    header: {
        background: '#f7f7f7'
    },
    headerCell: {
        color: '#1f1f1f',
    },
    zebraRow: {
        background: '#f9f9f9',
    }

}));

export {
    useTableStyle
}