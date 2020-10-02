#!/bin/bash
# Remove pypi tensorflow in favor of conda installation
source activate base
pip uninstall tensorflow -y
conda install tensorflow==1.14 -y

node jsonrpc-ws-proxy --port $PORT --languageServers ~/language-servers.yml

