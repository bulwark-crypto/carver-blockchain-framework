import { DateFormatParams } from "./variants/helpers/dateFormat"


const variants = {
    helpers: {
        dateFormat: {

        } as DateFormatParams
    }
}


export const config = {
    version: 1,

    reservations: {
        useWindowHostname: true, // If true reservation server is running on window.hostname
        port: 3001
    },
    nchan: {
        useWindowHostname: true, // If true nchan server is running on window.hostname
        port: 8013
    },
    variants
}