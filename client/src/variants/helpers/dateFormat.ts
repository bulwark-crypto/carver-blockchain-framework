

import moment from 'moment';

//@todo move to helpers
const dateFormat = (date: Date, fmt = 'YYYY-MM-DD HH:mm:ss') => {
    if (!date) {
        date = new Date();
    }

    return `${moment(date).utc().format(fmt)} UTC`;
};

export default dateFormat