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

    /*
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

            // CORS handling
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            if (request.method === 'OPTIONS') {
                response.writeHead(200);
                response.end();
                return;
            }

            console.log('here', request.method, request.url);


            const getNewSessionId = () => {
                return uuidv4(); // Each new session gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
            }


            const getPrivateKey = () => {
                const token = request.headers['authorization'].split(/\s+/).pop();

                return Buffer.from(token, 'base64').toString()
            }

            const getCarverFrameworkVersion = () => {
                return Number(request.headers['x-carver-framework-version']);
            }

            const reserveChannnel = async () => {

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


            const getReply = async () => {

                switch (request.method) {
                    case 'GET':
                        switch (request.url) {
                            case '/authSubscriber':
                                try {
                                    console.log('atuh subscriber:!');
                                    return await authSubscriber();
                                } catch (err) {
                                    console.log('athorization error:');
                                    console.log(err);
                                    throw { type: apiRestContext.commonLanguage.errors.UnknownSubscriptionError }
                                }
                        }
                    case 'POST':
                        switch (request.url) {
                            case '/command':
                                console.log('***command');

                                return true;

                                break;
                            case '/reserveChannnel':
                                try {
                                    return await reserveChannnel();
                                } catch (err) {
                                    console.log('reservation error:');
                                    console.log(err);
                                    throw { type: apiRestContext.commonLanguage.errors.UnknownReservationError }
                                }
                        }
                }

                throw { type: apiRestContext.commonLanguage.errors.UnknownPath }
            }


            response.setHeader('Content-Type', 'application/json');

            try {
                const reply = await getReply();

                response.writeHead(200);
                response.end(JSON.stringify(reply))
            } catch (err) {
                console.log('err to frontend:', err);
                response.writeHead(500);
                response.end(JSON.stringify(err))
            }

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