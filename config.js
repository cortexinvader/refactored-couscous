require('dotenv').config();

global.APIs = {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    bg: 'http://bochil.ddns.net',
    fgmods: 'https://api-fgmods.ddns.net'
};

global.APIKeys = {
    'https://api.xteam.xyz': process.env.XTEAM_API_KEY || 'd90a9e986e18778b',
    'https://api.lolhuman.xyz': process.env.LOLHUMAN_API_KEY || '85faf717d0545d14074659ad',
    'https://api.neoxr.my.id': process.env.NEOXR_API_KEY || 'yourkey',
    'https://violetics.pw': process.env.VIOLETICS_API_KEY || 'beta',
    'https://zenzapis.xyz': process.env.ZENZAPIS_API_KEY || 'yourkey',
    'https://api-fgmods.ddns.net': process.env.FGMODS_API_KEY || 'fg-dylux'
};

module.exports = {
    WARN_COUNT: 3,
    APIs: global.APIs,
    APIKeys: global.APIKeys
};