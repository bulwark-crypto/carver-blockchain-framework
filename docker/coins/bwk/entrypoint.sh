#!/bin/dash

if [ ! -f ~/.bulwark/bulwark.conf ]; then
  touch ~/.bulwark/bulwark.conf
fi

if ! grep rpcpassword ~/.bulwark/bulwark.conf; then
  touch ~/.bulwark/bulwark.conf
  { echo "rpcuser=${RPC_USER}"; echo "rpcpassword=${RPC_PASSWORD}"; echo "printtoconsole=1"; } >> ~/.bulwark/bulwark.conf
fi

exec /usr/local/bin/bulwarkd "$@"