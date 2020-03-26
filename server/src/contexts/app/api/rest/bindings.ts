import apiRestContext from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../../classes/contexts/contextMap';
import { withContext } from '../../../../classes/logic/withContext';

import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

import carverUserBindings from '../../carverUser/bindings'
import publicStateBindings from '../publicState/bindings'
import { RegisteredContext } from '../../../../classes/contexts/registeredContext';

const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });

    const { registeredContext: apiRest } = await appContextStore.register({
        context: apiRestContext,
        storeEvents: false
    });

    const carverUserContexts = new Map<string, RegisteredContext>();

    const createContexts = async (id: string, privateKey: string) => {
        const carverUser = await carverUserBindings.bindContexts(contextMap, id);
        await publicStateBindings.bindContexts(contextMap, id);

        carverUserContexts.set(id, carverUser); //@todo add privateKey to map
    }
    withContext(apiRest)
        .handleQuery(apiRestContext.commonLanguage.queries.CreateSessionContext, async ({ id, privateKey }) => {
            await createContexts(id, privateKey);
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
*/

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
        const port = 3001 //@todo move to config

        const server = express();
        server.use(bodyParser.json());
        server.use(cors())

        server.post('/reserveChannnel', async (req, res) => {
            const getNewSessionId = () => {
                return uuidv4(); // Each new session gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
            }
            const getPrivateKey = () => {
                const token = req.headers['authorization'].split(/\s+/).pop();

                return Buffer.from(token, 'base64').toString()
            }

            const getCarverFrameworkVersion = () => {
                return Number(req.headers['x-carver-framework-version']);
            }

            // For now all api endpoints will simply generate a new session
            const id = getNewSessionId();
            const frameworkVersion = getCarverFrameworkVersion();
            const { remoteAddress } = req.connection;
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

            const response = {
                id
            };

            res.json(response);
        });

        server.post('/command', async (req, res) => {
            const { id, privateKey, type, payload } = req.body;

            const carverUserKey = id;

            if (!carverUserContexts.has(carverUserKey)) {
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.IdNotFound });
                return;
            }

            try {
                const carverUser = carverUserContexts.get(carverUserKey); //@todo add private key to id
                await carverUser.dispatch({ type, payload });
                res.json(true);
            } catch (err) {
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.UnknownCommandException });
            }
        });

        server.get('/authSubscriber', async (req, res) => {
            // These are useful for looking at auth headers
            //console.log(request.method);
            //console.log(request.url);
            //console.log(request.headers);

            try {
                const id = req.headers['x-channel-id'];
                const ip = req.headers['x-forwarded-for']; // remote ip

                await apiRest.dispatch({
                    type: apiRestContext.commonLanguage.commands.AuthorizeSubscriber,
                    payload: {
                        id,
                        ip
                    }
                });
                res.json(true);
            } catch (err) {
                console.log('athorization error:');
                console.log(err);
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.UnknownSubscriptionError });
            }
        });

        server.listen(port, () => {
            console.log(`Reservation server is listening on ${port}`);
        });
    }
    bindServer();
}

export default {
    bindContexts
}