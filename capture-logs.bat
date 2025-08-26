@echo off
echo Capturing dev server log...
npm run dev > dev-log.txt 2>&1
echo.
echo Capturing build log...
npm run build-win > build-log.txt 2>&1
echo.
echo Logs captured! Check dev-log.txt and build-log.txt
echo.
echo Current package.json build section:
findstr /N /A:0C "build" package.json
echo.
pause