
interface Breadcrumb {
    title: string;
    link?: string;
}
export interface Page {
    title: string;
    breadcrumbs?: Breadcrumb[];
    variants: any[];
    pathname?: string;
}

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
                    { variant: 'txs' }
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
                    { variant: 'txs', height }
                ],
                breadcrumbs: [
                    { title: `Blocks` },
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
                    { title: `Addresses` },
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
                    { title: `Transactions` },
                    { title: `${txid}` },
                ],
                pathname: `/transactions/${txid}`
            }
    }
}

const findPageByPathname = (pathname: string) => {
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