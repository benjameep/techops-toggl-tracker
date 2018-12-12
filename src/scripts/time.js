import moment from 'moment';

export function getPeriod() {
    var dfc = Number(sessionStorage.distanceFromCurrent || 0);
    if (sessionStorage.timeunit == 'month') {
        return [
            moment().subtract(dfc, 'month').startOf('month'),
            moment().subtract(dfc, 'month').endOf('month')
        ];
    } else {
        return [
            moment().day(-dfc * 7 + 1),
            moment().day(-dfc * 7 + 6)
        ];
    }
}

export function chartTitle() {
    var [start, end] = getPeriod();
    if (sessionStorage.timeunit == 'month') {
        return start.format('MMMM YYYY');
    } else {
        if (start.month() == end.month()) {
            return start.format('MMMM D') + ' - ' + end.format('D');
        } else {
            return start.format('MMM D') + ' - ' + end.format('MMM D');
        }
    }
}