// Some work for splitting out contexts into their own processes

/*const { fork } = require('child_process');
import appContext from '../contexts/app'

if (process.argv.length != 3) {
    throw Error('Must pass context type as arg (ex: APP)');
}

const type = process.argv[2];

const knownContexts = ['APP']

if (!knownContexts.find(knownContext => knownContext === type)) {
    throw Error('Unknown context')
}


const ipc = require('node-ipc');
ipc.config.id = type;
ipc.config.retry = 1500;

const path = `${__dirname}/tmp/${type}`;
ipc.serve(path, () => {
    ipc.server.on(
        'message',
        (data: any, socket: any) => {
            ipc.log('got a message : ' + data);
            ipc.server.emit(
                socket,
                'message',  //this can be anything you want so long as
                //your client knows.
                data + ' world!'
            );
        }
    );
    ipc.server.on(
        'socket.disconnected',
        (socket: any, destroyedSocketID: any) => {
            ipc.log('client ' + destroyedSocketID + ' has disconnected!');
        }
    );

});
*/