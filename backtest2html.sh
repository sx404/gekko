#!/bin/bash

/usr/bin/time --verbose node gekko.js --config config-eth.js --backtest --set debug=true | aha --black --title 'T5forecast_ETHEUR_20180101-20181226' > backtest-results/T5forecast_ETHEUR_20180101-20181226.html
