import { MapType as TxsMapType } from "../../widgets/txs/bindings";
import { Page } from './sharedInterfaces'

const getPage = (params: any): Page => {
    const { page } = params;
    switch (page) {
        case 'blocks':
            return {
                title: 'Blocks',
                variants: [
                    { variant: 'blocks' }
                ],
                breadcrumbs: [
                    { title: 'Blocks' }
                ],
                pathname: '/blocks'
            }
        case 'transactions':
            return {
                title: 'Transactions',
                variants: [
                    { variant: 'txs', mapType: TxsMapType.Transactions }
                ],
                breadcrumbs: [
                    { title: 'Transactions' }
                ],
                pathname: '/transactions'
            }
        case 'stats':
            return {
                title: 'Statistics',
                variants: [
                    { variant: 'stats', isShared: true }
                ],
                breadcrumbs: [
                    { title: 'Statistics' }
                ],
                pathname: '/stats'
            }
        case 'block':
            const { height } = params;
            return {
                title: `Block #${height}`,
                variants: [
                    { variant: 'blockInfo', height },
                    { variant: 'txs', height, mapType: TxsMapType.Block }
                ],
                breadcrumbs: [
                    { title: `Blocks`, pathname: '/blocks' },
                    { title: `${height}` },
                ],
                pathname: `/blocks/${height}`
            }
        case 'address':
            const { label } = params;
            return {
                title: `Address ${label}`,
                variants: [
                    { variant: 'addressMovementsForAddress', label }
                ],
                breadcrumbs: [
                    { title: `Addresses`, pathname: '/addresses' },
                    { title: `${label}` },
                ],
                pathname: `/addresses/${label}`
            }
        case 'tx':
            const { txid } = params;
            return {
                title: `Transaction ${txid}`,
                variants: [
                    { variant: 'tx', txid },
                    { variant: 'addressMovementsForTx', txid }
                ],
                breadcrumbs: [
                    { title: `Transactions`, pathname: '/transactions' },
                    { title: `${txid}` },
                ],
                pathname: `/transactions/${txid}`
            }
    }
}

//@todo theortically this can be matched with named regex groups (that way we don't even need this method)
const findPageByPathname = (pathname: string) => {
    // Specific block (ex: /blocks/1000)
    const blockMatch = pathname.match(/^\/blocks\/([0-9]{1,64})$/);
    if (blockMatch) {
        return { page: 'block', height: Number(blockMatch[1]) };
    }

    // Specific address (ex: /addresses/bSJhN1...)
    const addressMatch = pathname.match(/^\/addresses\/([a-zA-Z0-9]{1,64})$/);
    if (addressMatch) {
        return { page: 'address', label: addressMatch[1] };
    }

    // Specific transaction (ex: /transactions/fe6259a...)
    const transactionMatch = pathname.match(/^\/transactions\/([a-zA-Z0-9]{1,64})$/);
    if (transactionMatch) {
        return { page: 'tx', txid: transactionMatch[1] };
    }

    switch (pathname) {
        case '/':
        case '/blocks':
            return { page: 'blocks' };
        case '/transactions':
            return { page: 'transactions' };
        case '/stats':
            return { page: 'stats' };
    }

    // By default always go to blocks page
    //@todo 404?
    return { page: 'blocks' };
}

export {
    getPage,
    findPageByPathname
}