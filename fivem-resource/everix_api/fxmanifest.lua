fx_version 'cerulean'
game 'gta5'

name 'everix_api'
description 'Exposes a small authenticated HTTP API so the Everix Discord bot can look up owned vehicles and change a plate/phone number, without opening MySQL to the internet.'
version '1.0.0'

server_scripts {
  'server/main.lua'
}

dependencies {
  'oxmysql'
}
