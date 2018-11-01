# Green Gekko [![npm](https://img.shields.io/npm/dm/gekko.svg)]() [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko) [![Build status](https://ci.appveyor.com/api/projects/status/github/askmike/gekko?branch=stable&svg=true)](https://ci.appveyor.com/project/askmike/gekko)

Interactive Crypto Trading Bot, askmike/gekko v0.6.7 based

| Gekko with Telegram bot | Gekko with Telegram in admin mode |
| ------------------------ | --------------------------------- |
| ![Gekko with telegram bot](https://github.com/mark-sch/gekko/raw/develop/screenshots/telegrambot-crypto-overview.jpg) | ![Gekko with telegram in admin mode](https://github.com/mark-sch/gekko/raw/develop/screenshots/telegrambot-admin-sell.jpg) |

**See screenshots folder**

- Extended trading strategy possibilities:
   - set the trading amount within the advice (e.g. 50% of my portfolio)
   - set market making or market taking order options within the advice
   - receive "onCandle" events inside the strategy, to get 1 minute candles and allow developers to build multi-timeframe strategies
   - receive "onAdvice" events inside the strategy for plugin-to-plugin communication, e.g. notify the strategy with telegram initiated advices, or create containers with multiple strategies.
- Core enhancements to write async trading strategies with new async tulip and talib indicator wrappers. The asyc/await gekko core pattern allows developers to write multi-timeframe and multi-market strategies with talib andtulip indicators. within any multi-timeframe candles. The core is able to wait for async strategies without running into race conditions.
- Rewritten telegram bot
  - User mode
    - list trading pair, strategy and candle size
    - get current price from exchange
    - get trading trend
    - subscribe/unsubscribe to trading advices
  - Admin mode
    - Password restricted access
    - Manually buy and sell tokens
       - with a sticky order
       - with a market taking order
       - set stop-loss and take-profit settings
    - Dynamically view and change strategy settings
    - Show exchange portfolio value
- Advanced Postgresql DB features (used as default db to prevent sqlite lockings)
  - Rewritten postgres plugin, using connection pooling and transaction safe candle writing (Postgres 9.5+ required)
- New command line options:
  - Checks plugin dependencies and automatically enable a plugin when it is mandatory inside a certain mode, e.g. enable the Paper Trader when in backtest mode. See new mandatoryOn property in plugins.js file.
  - New --set command line option to override config settings, e.g. --set debug=true to enable the debug mode output - no need to touch the config.js for a quick debug run
- Additional exchanges (ccxt), supporting market watch, history import, backtesting and live trading
  - HitBtc exchange support
  - HuobiPro exchange support
  - OKEX exchange support
- Coinmarketcap importer
  - Several exchanges, like HuobiPro and OKEX do not offer a large timeframe of history data. The universal Coinmarketcap importer allows fast imports for nearly every market to enable backtesting (based on 5 min. candles)
- Extended log output
    - mailer.js informs with buy and sell events by mail (different to go short/long advices)
    - More info during paper trader backtesting
- Added often used package dependencies by default to get started quickly (npm install)

## Backtest examples

- [T5mainasync strategy, ETHEUR, 20180101-20181001](https://git.io/fxgdH) / [settings](https://raw.githubusercontent.com/mark-sch/gekko/develop/sample-eth.js) / [source](https://raw.githubusercontent.com/mark-sch/gekko/develop/strategies/T5mainasync.js)
- [T5multimarket_strategy, ETHEUR, 20180101-20181001](https://git.io/fxrSq) / [source](https://raw.githubusercontent.com/mark-sch/gekko/develop/strategies/T5multimarket.js)
- [T5multitime strategy, ETHEUR, 20180101-20181001](https://git.io/fxrSa)
- [T5multimix strategy, ETHEUR, 20180101-20181001](https://git.io/fxrSb)

## Getting started

- git clone https://github.com/mark-sch/gekko
- cd gekko
- npm install
- cd exchange
- npm install
- cd ..
- node gekko --config sample-eth.js --import --set debug=true
- node gekko --config sample-eth.js --backtest --set debug=true

from time to time the exchange markets should be updated with a utility - to get new coin pairs:

- cd exchange/util/genMarketFiles/
- node update-kraken.js
- node update-binance.js

(postgresql experience required to previously setup postgres. Sample config assumes an existing db user gekkodbuser, pass 1234, with added role permission to createdb. PostgreSQL 9.5+ required.)

> A good practice to run Gekko processes on a server is using process manager 2 tool:
>
> **pm2 start gekko.js -i 1 --name "gekko-bnb" -- --config config-bnb.js**

## Documentation

See [the documentation website](https://gekko.wizb.it/docs/introduction/about_gekko.html).

