
interface Breadcrumb {
    title: string;
    link?: string;
}
export interface Page {
    title: string;
    breadcrumbs?: Breadcrumb[];
    variants: any[];
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
                ]
            }
        case 'transactions':
            return {
                title: 'Transactions',
                variants: [
                    { variant: 'txs' }
                ],
                breadcrumbs: [
                    { title: 'Transactions' }
                ]
            }
        case 'stats':
            return {
                title: 'Statistics',
                variants: [
                    { variant: 'stats', isShared: true }
                ],
                breadcrumbs: [
                    { title: 'Statistics' }
                ]
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
                ]
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
                ]
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
                ]
            }
    }
}

export {
    getPage
}