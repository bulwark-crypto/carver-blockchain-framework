#!/bin/dash

if [ ! -f ~/.bulwark/bulwark.conf ]; then
  touch ~/.bulwark/bulwark.conf
fi

if ! grep rpcpassword ~/.bulwark/bulwark.conf; then
  touch ~/.bulwark/bulwark.conf
  { echo "rpcuser=${RPC_USER}"; echo "rpcpassword=${RPC_PASSWORD}"; echo "rpcport=52547"; echo "rpcbind=172.25.0.110"; echo "rpcallowip=172.25.0.104"; echo "rpcallowip=172.25.0.110"; echo "printtoconsole=1" echo "txindex=1"; } >> ~/.bulwark/bulwark.conf
fi

exec /usr/local/bin/bulwarkd "$@"