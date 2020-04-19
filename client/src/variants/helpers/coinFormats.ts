import numeral from 'numeral'

import { Coin } from "../../core/carver/sharedInterfaces"

export enum CoinFormatType {
    Amount,
    Tooltip
}
interface CoinFormatParams {
    value: number;
    type: CoinFormatType;
    coin: Coin;
}
const coinFormat = ({ value, type, coin }: CoinFormatParams) => {
    switch (type) {
        case CoinFormatType.Amount:
            const amount = numeral(value.toFixed(coin.displayDecimals)).format(coin.formats.amount.fixedFormat);

            return `${amount} ${coin.shortName}`;
    }

}

export {
    coinFormat
}