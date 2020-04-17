

import moment from 'moment';

// This area is in variants/helpers folder for client-specific functions. Implemented outside of core folder.

//@todo move to helpers

interface DateFormatParams {
    date?: Date;
    fmt?: string;
    hideAgo?: boolean;
}
const dateFormat = (params: DateFormatParams) => {
    const options = {
        date: new Date(),
        fmt: 'YYYY-MM-DD HH:mm:ss',
        ...params
    }
    const { hideAgo } = params;

    const utcMoment = moment(options.date).utc();

    const date = `${utcMoment.format(options.fmt)} UTC`;
    if (hideAgo) {
        return date;
    }
    return `${date} (${utcMoment.fromNow()})`;
};

export default dateFormat