@echo off

:: React Frontend (npm start)
cd /d C:\CollegeStuff\GreenGauge_VULTR\frontend && start npm start

:: Node Backend (server.js)
cd /d C:\CollegeStuff\GreenGauge_VULTR\backend && start node server.js

:: Node Backend (espconn.js)
cd /d C:\CollegeStuff\GreenGauge_VULTR\backend && start node espconn.js

:: Python App 1
cd /d C:\CollegeStuff\GreenGauge_VULTR\backend && start python app.py

:: Python App 2
cd /d C:\CollegeStuff\GreenGauge_VULTR\chatbotui && start python app.py

:: PHP Server
cd /d C:\CollegeStuff\GreenGauge_VULTR\chatbotui && start php -S localhost:8000 -t public/

:: End of script
exit
