# Gekko [![npm](https://img.shields.io/npm/dm/gekko.svg)]() [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko) [![Build status](https://ci.appveyor.com/api/projects/status/github/askmike/gekko?branch=stable&svg=true)](https://ci.appveyor.com/project/askmike/gekko)

Crypto Trading Bot based on askmike/gekko v0.6.x

>> See screenshots folder <<

- Rewritten telegram bot
  - User mode
    - list trading pair, strategy and candle size
    - get current price from exchange
    - get trading trend
    - subscribe/unsubscribe to trading advices
  - Admin mode
    - Password restricted access
    - Manually buy and sell tokens with one click
    - Show exchange portfolio value
- Advanced Postgresql DB features (used as default db to prevent sqlite lockings)
  - Rewritten postgres plugin, using connection pooling and transaction safe candle writing (Postgres 9.5+ required)
- New command line options:
  - Evaluate plugin dependencies and automatically enable a plugin when it is mandatory inside a certain mode, e.g. enable the Paper Trader when in backtest mode. See new mandatoryOn property in plugins.js file.
  - New --set command line option to override config settings, e.g. --set debug=true to enable the debug mode output - no need to touch the config.js for a quick debug run
- Additional exchange support (using ccxt)
  - HitBtc exchange support
    - Market watcher
    - History import
    - Backtesting
    - Live trading
  - HuobiPro exchange support
    - Market watcher
    - History import from Coinmarketcap
    - Backtesting
    - Live trading
  - OKEX exchange support
    - Market watcher
    - History import from Coinmarketcap
    - Backtesting
    - Live trading
  - Extended log output
    - mailer.js informs with buy and sell events by mail (different to go short/long advices)
    - More info during paper trader backtesting
  - Added often used package dependencies by default to get started quickly (npm install)

## Getting started

- git clone https://github.com/mark-sch/gekko
- cd gekko
- npm install
- cd exchange
- npm install
- cd ..
- npm start

from time to time the exchange markets should be updated with a utility - to get new coin pairs:

- cd exchange/util/genMarketFiles/
- node update-kraken.js
- node update-binance.js

(postgresql experience required to previously setup postgres. Sample config assumes an existing db user gekkodbuser, pass 1234, with added role permission to createdb. PostgreSQL 9.5+ required.)

## Documentation

See [the documentation website](https://gekko.wizb.it/docs/introduction/about_gekko.html).

