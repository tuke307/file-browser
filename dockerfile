docker run --rm -v C:/Users/MEISSTO/Projects/webengineering_API_TINF22C_4567455/fileservice:/app -v C:\Users\MEISSTO\Projects\webengineering_API_TINF22C_4567455\fileservice\upload.ini:/usr/local/etc/php/conf.d/upload.ini -w /app -p 8080:80 -d php:7.4-cli php -S 0.0.0.0:80 router.php