#!/bin/bash

node gekko.js --config config-eth.js --backtest --set debug=true | aha --black --title 'T5strat_ETHEUR_20180101-20181001' > backtest-results/T5strat_ETHEUR_20180101-20181001.html
