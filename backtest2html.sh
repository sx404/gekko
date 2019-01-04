#!/bin/bash

/usr/bin/time --verbose node gekko.js --config sample-eth.js --backtest --set debug=true | aha --black --title 'T5mainasync_ETHEUR_20180101-20181231' > backtest-results/T5mainasync_ETHEUR_20180101-20181231.html
