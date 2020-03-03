import { ContextStore } from '../../../../classes/contexts/contextStore'

import apiSessionContext from '../session/context'
import apiRestContext from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../../classes/contexts/contextMap';



interface GetNewSessionParams {
    id: string;
    sourceIdentifier: string;
}
const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const apiSession = await appContextStore.get({ context: apiSessionContext });

    const { registeredContext: apiRest } = await appContextStore.register({
        context: apiRestContext,
        storeEvents: true
    });


    const bindServer = () => {
        const http = require('http')
        const port = 3001 //@todo move to config

        const reserveNewSession = async ({ id, sourceIdentifier }: GetNewSessionParams) => {


            const payload = {
                id,
                sourceIdentifier // We need to uniquely identify sources so we can rate limit new connections per-ip and prevent spamming reservations
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

        const requestHandler = async (request: any, response: any) => {
            const carverFrameworkVersionHeader = 'x-carver-framework-version';

            const getCarverFrameworkVersion = () => {
                return request.headers[carverFrameworkVersionHeader];
            }
            const getNewSessionId = () => {
                return uuidv4(); // Each new session gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
            }

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