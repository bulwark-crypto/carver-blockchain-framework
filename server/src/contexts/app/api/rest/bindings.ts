import { ContextStore } from '../../../../classes/contexts/contextStore'

import apiSessionContext from '../session/context'
import apiRestContext, { Reservation } from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../../classes/contexts/contextMap';
import { withContext } from '../../../../classes/logic/withContext';



const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const apiSession = await appContextStore.get({ context: apiSessionContext });

    const { registeredContext: apiRest } = await appContextStore.register({
        context: apiRestContext,
        storeEvents: true
    });


    const reserveNewSession = async ({ id, ip }: Reservation) => {


        const payload = {
            id,
            ip // We need to uniquely identify sources so we can rate limit new connections per-ip and prevent spamming reservations
        }

        // If this succeeds then we reseved a new socket. A new session would be added to apiSession state
        console.log(`Request new session: ${id}!`);

        //@todo add rate limiting
        // Create and return a new session with a specific id
        await apiSession.dispatch({ type: apiSessionContext.commonLanguage.commands.ReserveNewSession, payload })

        //const newSession = await apiSession.queryStorage(apiSessionContext.commonLanguage.storage.FindSessionById, id)
        // console.log('session by id:', newSession, id);

        return id;
    }

    withContext(apiRest)
        .handleQuery(apiRestContext.commonLanguage.queries.CreateSessionContext, async (payload: Reservation) => {
            console.log('requested reservation:', payload);

            const id = await reserveNewSession(payload);

            return
        });

    /*
withContext(apiSession)
    .streamEvents({
        type: apiSessionContext.commonLanguage.events.SessionReserved,
        sessionOnly: true,
        callback: async (event) => {
            console.log('**session actually reserved:', event);
        }
    });*/


    /**
     * Start the "reservation server".
     * 
     * Ideally this server runs in it's own process and in it's own cntainer.
     * 
     * The initialization of an event stream for client is as follows:
     * 
     * 1. Client sends a POST to /reserveChannnel with "secret" param (a random guiid)
     * 2. Server replies with id (If there is space on reservation server).
     * 3. 
     */
    const bindServer = () => {
        const http = require('http')
        const port = 3001 //@todo move to config


        const requestHandler = async (request: any, response: any) => {

            console.log(request.method);
            console.log(request.url);

            /*
                        const reserveChannel = async () => {
                            const id = request.headers['x-channel-id']
            
                            await apiRest.dispatch({
                                type: apiRestContext.commonLanguage.commands.ReserveChannel,
                                payload: {
                                    id,
                                    remoteAddress,
                                    frameworkVersion,
                                    privateKey
                                }
                            })
                        }*/

            const reserveChannnel = async () => {
                console.log('@todo');
            }
            const authSubscriber = async () => {
                // These are userful for looking at auth headers
                //console.log(request.method);
                //console.log(request.url);
                //console.log(request.headers);

                const id = request.headers['x-channel-id'];
                const ip = request.headers['x-forwarded-for']; // remote ip


                await apiRest.dispatch({
                    type: apiRestContext.commonLanguage.commands.AuthorizeSubscriber,
                    payload: {
                        id,
                        ip
                    }
                })
            }
            /**
             * To initialize
             */
            const authPublisher = async () => {
                // These are userful for looking at auth headers
                console.log(request.method);
                console.log(request.url);
                console.log(request.headers);

                const [id, secret] = request.headers['x-channel-id'].split('_');

                //@todo ensure only specific ip can be a publisher (via config)
                const ip = request.headers['x-forwarded-for']; // remote ip 

                const publisherType = request.headers['x-publisher-type']; //@todo ensure https only (configurable)


                await apiRest.dispatch({
                    type: apiRestContext.commonLanguage.commands.AuthorizePublisher,
                    payload: {
                        id,
                        ip
                    }
                })
            }



            const getNewSessionId = () => {
                return uuidv4(); // Each new session gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
            }
            switch (request.method) {
                case 'GET':
                    switch (request.url) {
                        case '/reserveChannnel':
                            await reserveChannnel();
                            break;
                        case '/authSubscriber':
                            await authSubscriber();
                            break;
                        case '/authPublisher':
                            await authPublisher();
                            break;
                    }
            }


            response.writeHead(200);
            response.end('ok');
            return;

            // CORS handling
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', 'authorization,x-carver-framework-version');
            if (request.method === 'OPTIONS') {
                response.writeHead(200);
                response.end();
                return;
            }

            const getPrivateKey = () => {
                const token = request.headers['authorization'].split(/\s+/).pop();

                return Buffer.from(token, 'base64').toString()
            }

            const getCarverFrameworkVersion = () => {
                return Number(request.headers['x-carver-framework-version']);
            }

            const getReply = async () => {

                // For now all api endpoints will simply generate a new session
                const id = getNewSessionId();
                const frameworkVersion = getCarverFrameworkVersion();
                const { remoteAddress } = request.connection;
                const privateKey = getPrivateKey();

                await apiRest.dispatch({
                    type: apiRestContext.commonLanguage.commands.ReserveSocket,
                    payload: {
                        id,
                        remoteAddress,
                        frameworkVersion,
                        privateKey
                    }
                })

                return {
                    id
                }
            }

            const reply = await getReply();

            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(reply))
        }

        const server = http.createServer(requestHandler)

        server.listen(port, async (err: any) => {
            if (err) {
                //@todo handle error
                return console.log('Could not start reservation port', err)
            }

            console.log(`Reservation server is listening on ${port}`)



            console.log('started');

        })
    }
    bindServer();
}

export default {
    bindContexts
}