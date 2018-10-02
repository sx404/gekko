// ****************************************************************************
// *** T5multimarket.js                                                     ***
// ****************************************************************************
// * Purpose: lean, proof of concept strategy to watch multi-markets inside
// * one gekko trading strategy.
// * The goal is to take advantage of the tight price movement relationship
// * between bitcoin and altcoins.
// * Requirements: Async/await gekko core extension, PostgreSQL db and a  
// * second gekko paper trader to feed the db with binance/btc data.
// ****************************************************************************


const _ = require('lodash');
const moment = require('moment')
const util = require ('../core/util.js');
const dirs = util.dirs();
const log = require('../core/log.js');
const config = util.getConfig();
const adapter = config[config.adapter];
const Reader = require('../' + adapter.path + '/reader.js');
const TALIBASYNC = require('../strategies/indicators/TalibAsync.js');

var stratFlash = {};


stratFlash.init = function () {
    this.name = 'T5 multi market analyzer (BTC)';

    this.reader = new Reader('binance');

    this.ppo = new TALIBASYNC({ indicator: 'ppo', length: 3, options: { optInFastPeriod: 3, optInSlowPeriod: 2, optInMAType: 0 } });
    this.ppoFC = new TALIBASYNC({ indicator: 'ppo', length: 3, options: { optInFastPeriod: 3, optInSlowPeriod: 2, optInMAType: 0 } });
}


stratFlash.onCandle = async function (candle) {
    //read candle for second market (btc)
    return new Promise((resolve, reject) => {
        var future = candle.start.add(1, 'second').unix();
        var start = candle.start.subtract(1, 'second').unix();
        
        //get foreign candle from db, similar to gekko leecher mode
        this.reader.get(start, future, 'full', async (err, candles) => {
            var amount = _.size(candles);
            
            if(amount === 0) {
               log.debug('no new BTC candles');
               resolve();
               return;
            }

            candles[0].start = moment.unix(candles[0].start); //convert from unix epoch to moment
            
            this.ppoFC.result = await this.ppoFC.update(candles[0]);
            this.ppo.result = await this.ppo.update(candle);
            
            if (this.ppoFC.result >= 0.4 && this.ppo.result < this.ppoFC.result) {
                log.debug('\n\n', 'ETH:', candle.close, candle.start.format() ,this.ppo.result,' ::: BTC:', candles[0].close, candles[0].start.format(), this.ppoFC.result);
                this.advice({
                    direction: 'long',
                    trigger: {
                    type: 'trailingStop',
                    trailPercentage: 0.1
                    }
                });
             }
            
            resolve();
        }, 'candles_usdt_btc');
    });
}


stratFlash.update = function (candle) {
    //no need for strat update, we work with onCandle custom batching
}


stratFlash.check = function (candle) {
   //no need for strat check, we work with onCandle custom batching and strat execution
}


module.exports = stratFlash;
