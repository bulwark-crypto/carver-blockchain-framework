/**
 * Both client and server have these common interfaces.
 * Ideally they'll be imported via a single file in the future. (The files are identical in both server and client)
 */

/**
 * Coins will have different formatting rules (these rules are shared by both server and client. They're only suggestions on how to format data for display)
 */
interface CoinFormat {
    fixedFormat: string;
}
/**
 * These are formatting suggestions. The number that is passed to a client, the client can choose to display it in this format. Each coin can have it's own set of formats.
 */
interface CoinFormats {
    amount: CoinFormat, // Basic amount 
    tooltip: CoinFormat, // Hovering over a number will show a larger percision tooltip
}
export interface Coin {
    name: string;
    longName: string;
    shortName: string;
    displayDecimals: number;
    formats: CoinFormats;
    websiteUrl: string;
    masternodeCollateral: number;
}

export interface CarverUser {
    /**
     * What version of the shared interfaces are we using? (this ensures that both server and client data is shaped with same interfaces)
     * You do not have to increment the version each time there is an update to the shape. Only increment the shape version if there are breaking changes.
     **/
    interfaceShapeVersion: number;
    widgets: any[];
    page: Page;
    coin: Coin;
}


interface Breadcrumb {
    title: string;
    href?: string;
    pathname?: string;
}
export interface Page {
    title: string;
    breadcrumbs?: Breadcrumb[];
    variants: any[];
    pathname?: string;
}