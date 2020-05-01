import apiRestContext from './context'

import * as uuidv4 from 'uuid/v4'
import { ContextMap } from '../../../../classes/contexts/contextMap';
import { withContext } from '../../../../classes/logic/withContext';

import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'

import carverUserContext from '../../carverUser/context'
import publicStateContext from '../../api/publicState/context'

import carverUserBindings from '../../carverUser/bindings'
import publicStateBindings from '../publicState/bindings'
import { RegisteredContext } from '../../../../classes/contexts/registeredContext';

import widgetStatsBindings from '../../../widgets/shared/stats/bindings'

interface RegisterShareWidgetParams {
    variant: string;
    widgetBindings: any;
}

const bindContexts = async (contextMap: ContextMap) => {
    const appContextStore = await contextMap.getContextStore({ id: 'APP' });
    const usersContextStore = await contextMap.getContextStore({ id: 'CARVER_USERS' });
    const publicStateContextStore = await contextMap.getContextStore({ id: 'PUBLIC_STATES' });

    const { registeredContext: apiRest, stateStore: apiRestStateStore } = await appContextStore.register({
        context: apiRestContext,
        storeEvents: false
    });


    const sharedWidgets = new Map<string, any>();

    //@todo these two maps are not necessary. the /command should dispatch to apiRest context (to check if id is registered)
    const carverUserContexts = new Map<string, RegisteredContext>();
    const publicStateContexts = new Map<string, RegisteredContext>();

    const createCarverUserContext = async (id: string) => {

        const carverUser = await carverUserBindings.bindContexts({ contextMap, id, sharedWidgets });
        carverUserContexts.set(id, carverUser);

        const publicState = await publicStateBindings.bindContexts(contextMap, id);
        publicStateContexts.set(id, publicState);
    }

    const removeCarverUserContext = async (id: string) => {
        // Disconnect user
        if (carverUserContexts.has(id)) {
            //@todo when user disconnects we need to issue an event so userAnalytics picks it up and removes users online/active widgets.
            //@todo This can be a global event for all contexts when they are unregistered (that way we can remove event streams) !!
            await usersContextStore.unregister({ context: carverUserContext, id });

            carverUserContexts.delete(id);
        }

        // Disconnect public state
        if (publicStateContexts.has(id)) {
            await publicStateContextStore.unregister({ context: publicStateContext, id });

            publicStateContexts.delete(id);
        }
    }

    withContext(apiRest)
        .handleQuery(apiRestContext.commonLanguage.queries.CreateSessionContext, async ({ id, privateKey }) => {
            await createCarverUserContext(id);

            return {
                id
            }
        })
        .handleQuery(apiRestContext.commonLanguage.queries.RemoveSessionContext, async ({ id }) => {

            await removeCarverUserContext(id);

            return {
                id
            }
        })
        .handleStore(apiRestContext.commonLanguage.storage.FindStats, async () => {
            const { reservations } = apiRestStateStore.state
            return {
                usersOnline: reservations.length
            }
        });


    /**
     * Shared widgets can be added to multiple carverUsers. They're removed from page but won't be removed from memory.
     * @todo move this to sharedWidgets.ts - registerSharedWidgets(contextMap,sharedWidgets)
     */
    const userWidgetsContextStore = await contextMap.getContextStore({ id: 'USER_WIDGETS' });

    const registerSharedWidget = async ({ variant, widgetBindings }: RegisterShareWidgetParams) => {
        const id = uuidv4();
        const registeredContext = await widgetBindings.bindContexts({ contextMap: contextMap, id, userWidgetsContextStore, variantParams: { variant } })

        sharedWidgets.set(variant, { registeredContext, id });
    }
    await registerSharedWidget({ variant: 'stats', widgetBindings: widgetStatsBindings });

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

            if (!carverUserContexts.has(id)) {
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.IdNotFound });
                return;
            }

            try {
                const carverUser = carverUserContexts.get(id); //@todo add private key to id
                await carverUser.dispatch({ type, payload });
                res.json(true);
            } catch (err) {
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.UnknownCommandException });
            }
        });

        /**
         * Called when user connects to nchan channel (after POST /reserveChannel)
         */
        server.get('/subscribers/sub', async (req, res) => {
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
                console.log('sub error:');
                console.log(err);
                res.status(500).json({ type: apiRestContext.commonLanguage.errors.UnknownSubscriptionError });
            }
        });

        server.get('/subscribers/unsub', async (req, res) => {
            try {
                const id = req.headers['x-channel-id'];

                await apiRest.dispatch({
                    type: apiRestContext.commonLanguage.commands.Unsubscribe,
                    payload: {
                        id
                    }
                });
                res.json(true);
            } catch (err) {
                console.log('unsub error:');
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