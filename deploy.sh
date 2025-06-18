#!/bin/bash
npm install
npm run build
sudo rsync -a --delete build/ /var/www/dev-env.co/public_html/
