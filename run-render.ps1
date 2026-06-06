# Configuración de la base de datos de Render
$env:DB_URL="jdbc:postgresql://dpg-d8hqspddt1ts73ejt63g-a.ohio-postgres.render.com:5432/gestor_camiones?sslmode=require&stringtype=unspecified"
$env:DB_USERNAME="transportemp"
$env:DB_PASSWORD="TMLv3UBMz8HY34HY7Yh5yOm596yuXqUz"

Write-Host "=========================================================" -ForegroundColor Green
Write-Host " Iniciando Gestor de Camiones con Base de Datos en Render" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Base de Datos: gestor_camiones"
Write-Host "URL: $env:DB_URL"
Write-Host "Usuario: $env:DB_USERNAME"
Write-Host "========================================================="

# Ejecutar la aplicación con Maven Wrapper
./mvnw.cmd spring-boot:run
Read-Host -Prompt "Presiona Enter para salir..."
