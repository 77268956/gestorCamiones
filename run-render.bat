@echo off
:: Configuración de la base de datos de Render (usando comillas para evitar problemas con el símbolo &)
set "APP_PROFILE=produccion"
set "DB_URL=jdbc:postgresql://dpg-d8hqspddt1ts73ejt63g-a.ohio-postgres.render.com:5432/gestor_camiones?sslmode=require&stringtype=unspecified"
set "DB_USERNAME=transportemp"
set "DB_PASSWORD=TMLv3UBMz8HY34HY7Yh5yOm596yuXqUz"

echo =========================================================
echo  Iniciando Gestor de Camiones con Base de Datos en Render
echo =========================================================
echo Base de Datos: gestor_camiones
echo URL: %DB_URL%
echo Usuario: %DB_USERNAME%
echo =========================================================

:: Ejecutar la aplicación con Maven Wrapper
call mvnw.cmd spring-boot:run
pause
