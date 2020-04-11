import { makeStyles } from "@material-ui/core";

const useTableStyle = makeStyles(theme => ({
    header: {
        background: '#f7f7f7'
    },
    headerCell: {
        color: '#1f1f1f',
    },
    zebraRow: {
        background: '#f8f9ff',
    }

}));

export {
    useTableStyle
}