@echo off
title Enviar Projeto Atualizado para o GitHub
echo ========================================================
echo   ENVIAR ATUALIZACAO COM SUPABASE PARA O GITHUB
echo ========================================================
echo.

:: Localizar o executavel do Git
set GIT_CMD=git
where git >nul 2>&1
if errorlevel 1 (
    if exist "%LOCALAPPDATA%\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe" (
        set "GIT_CMD=%LOCALAPPDATA%\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"
    ) else (
        for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd") do (
            if exist "%%D\git.exe" set "GIT_CMD=%%D\git.exe"
        )
    )
)

echo Usando Git: %GIT_CMD%
echo.

echo 1. Adicionando arquivos modificados...
"%GIT_CMD%" add .

echo.
echo 2. Registrando alteracoes...
"%GIT_CMD%" commit -m "feat: adicionar suporte a banco de dados em nuvem Supabase" 2>nul

echo.
echo 3. Enviando para o repositorio remoto no GitHub...
"%GIT_CMD%" push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================================
    echo   ATENCAO: Se o envio pedir login ou permissao:
    echo   1. Voce pode abrir o GitHub Desktop e publicar/dar push.
    echo   2. Ou usar seu Personal Access Token do GitHub.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   Sucesso! Codigo enviado para o GitHub.
    echo   O Vercel iniciara o deploy automatico em instantes!
    echo ========================================================
)

pause
