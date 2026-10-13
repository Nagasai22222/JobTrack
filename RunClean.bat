@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-24"
set "ADMIN_PASSWORD=admin_password"
.\maven\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run > run_clean.log 2>&1
