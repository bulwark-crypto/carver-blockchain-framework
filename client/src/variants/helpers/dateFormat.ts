

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
        maxDays: 31 * 3, // Stop show (xxx ago) on dates over this many days
        ...params
    }
    const { date, hideAgo, maxDays } = options;

    const utcMoment = moment(date).utc();

    const dateUtc = `${utcMoment.format(options.fmt)} UTC`;
    const daysDiff = moment().diff(utcMoment, "days");

    if (hideAgo || daysDiff > maxDays) {
        return dateUtc;
    }
    return `${dateUtc} (${utcMoment.fromNow()})`;
};

export default dateFormat