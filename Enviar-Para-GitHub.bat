@echo off
title Enviar Projeto para o GitHub
echo ========================================================
echo   CONECTAR E SUBIR PARA O GITHUB
echo ========================================================
echo.
echo Escolha como deseja conectar com o seu GitHub:
echo.
echo [1] Usar GitHub CLI (Abre o navegador para login com 1 clique e cria o repositorio automatico)
echo [2] Ja criei o repositorio no site do GitHub e quero colar o link
echo.
set /p OPTION="Digite 1 ou 2: "

if "%OPTION%"=="1" (
    echo.
    echo 1. Vamos autenticar seu usuario no GitHub pelo navegador...
    "C:\Program Files\GitHub CLI\gh.exe" auth login -w -p https -h github.com
    echo.
    echo 2. Criando o repositorio no seu GitHub e enviando os arquivos...
    "C:\Program Files\GitHub CLI\gh.exe" repo create controle-financeiro --public --source=. --remote=origin --push
) else (
    echo.
    set /p REPO_URL="Cole a URL do repositorio (ex: https://github.com/webcom77/controle-financeiro.git): "
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    git push -u origin main
)

echo.
echo ========================================================
echo   Processo finalizado com sucesso!
echo ========================================================
pause
