#!/usr/bin/env bash
# Inicia o backend do MediaLauncher
cd "$(dirname "$0")"
exec python3 server.py
