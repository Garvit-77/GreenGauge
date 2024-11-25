#!/bin/bash

# React Frontend (npm start)
cd /GreenGauge_VULTR/frontend && nohup npm start &

# Node Backend (server.js)
cd /GreenGauge_VULTR/backend && nohup node server.js &

# Node Backend (espconn.js)
cd /GreenGauge_VULTR/backend && nohup node espconn.js &

# Python App 1
cd /GreenGauge_VULTR/backend && nohup python app.py &

# Python App 2
cd /GreenGauge_VULTR/chatbotui && nohup python app.py &

# PHP Server
cd /GreenGauge_VULTR/chatbotui && nohup php -S localhost:8000 -t public/ &

# End of script
echo "All services are now running."
