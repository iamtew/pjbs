set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

default:
    just --list

favicon:
    magick assets/favicon.png -define icon:auto-resize=16,32,48 favicon.ico
