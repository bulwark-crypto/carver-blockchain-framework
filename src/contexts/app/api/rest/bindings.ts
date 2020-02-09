import { RegisteredContext } from '../../../../classes/contextStore';
import { withContext } from '../../../../classes/logic/withContext';
import { createContextStore, ContextStore } from '../../../../classes/contextStore'

import apiSessionContext from '../session/context'

import * as uuidv4 from 'uuid/v4'


interface GetNewSessionParams {
    sourceIdentifier: string;
}
const bindContexts = async (contextStore: ContextStore) => {
    const apiSession = await contextStore.get(apiSessionContext);

    const bindServer = () => {
        const http = require('http')
        const port = 3001 //@todo move to config

        const getNewSession = async ({ sourceIdentifier }: GetNewSessionParams) => {

            const getNewSessionId = () => {
                return uuidv4(); // Each new session gets it's own RFC4122 unique id. Makes it easy to identify unique ids across entire context network.
            }
            const id = getNewSessionId();

            const payload = {
                id,
                sourceIdentifier // We need to uniquely identify sources so we can rate limit new connections per-ip and prevent spamming reservations
            }

            // If this succeeds then we reseved a new socket. A new session would be added to apiSession state
            console.log(`Request new session: ${id}!`);
            await apiSession
                .dispatch({ type: apiSessionContext.commonLanguage.commands.ReserveNewSocket, payload })

            const newSession = apiSession.stateStore.state.activeSessions.find((activeSession: any) => activeSession.id === id); //@todo move to a query, shouldn't access state of another context directly
            return newSession;
        }

        const requestHandler = async (request: any, response: any) => {
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Access-Control-Allow-Origin', '*'); // CORS all hosts
            response.setHeader('Access-Control-Allow-Headers', 'X-Carver-Framework-Version');

            // For now all api endpoints will simply generate a new session
            const newSession = await getNewSession({ sourceIdentifier: request.connection.remoteAddress })

            // Return session without source data for privacy (no need to return ip)
            const { source, ...newSessionWithoutSource } = newSession
            response.end(JSON.stringify(newSessionWithoutSource))
        }

        const server = http.createServer(requestHandler)

        server.listen(port, (err: any) => {
            if (err) {
                return console.log('something bad happened', err)
            }

            console.log(`server is listening on ${port}`)
        })
    }
    bindServer();
}

export default {
    bindContexts
}