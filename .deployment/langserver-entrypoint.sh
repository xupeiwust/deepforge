#!/bin/bash
# Remove pypi tensorflow in favor of conda installation
source activate base
pip uninstall tensorflow -y
conda install tensorflow==1.14 -y

node $(npm root -g)/jsonrpc-ws-proxy/dist/server.js --port $PORT --languageServers ~/language-servers.yml

