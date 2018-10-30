// ****************************************************************************
// *** T5coworker.js                                                        ***
// ****************************************************************************
// * Purpose: strategy to automate manual trading advices in conjunction with
// * the telegram bot plugin.
// * When this strategy is run within a container and other strategies, it will
// * monitor manual settings to stop-losses and take-profits. The "normal"
// * gekko strategy will run side-by-side.
// * You can adjust these settings from inside the telegram bot dynamically   
// * whitout the need to restart gekko. This coworker strategy will monitor
// * and execute these settings when the price matches the condition.
// ****************************************************************************


const _ = require('lodash');
const moment = require('moment')
const util = require ('../core/util.js');
const dirs = util.dirs();
const log = require('../core/log.js');
const config = util.getConfig();

var stratCW = {};


stratCW.init = function () {
    this.name = 'T5 coworker strategy';
    
    this.t5coworker = {
        lastcandle: undefined,
        slvalue: 0,
        tpvalue: 0
    };
}


// ***************************************************************************
// * 1 Min. candle event
stratCW.onCandle = function (candle) {
    if (this.t5coworker.slvalue > 0 && candle.close < this.t5coworker.slvalue) {
        this.t5coworker.slvalue = 0;
        this.advice({ direction: 'short', infomsg: 'Stop-Loss condition was met, current price: ' + candle.close + '. The strategy T5coworker gave advice to go SHORT. Note: previous stop-loss setting is now deleted.' });
    }

    if (this.t5coworker.tpvalue > 0 && candle.close > this.t5coworker.tpvalue) {
        tthis.t5coworker.tpvalue = 0;
        this.advice({ direction: 'short', infomsg: 'Take-Profit condition was met, current price: ' + candle.close + '. The strategy T5coworker gave advice to go LONG. Note: previous take-profit setting is now deleted.' });
    }
}


// ***************************************************************************
// * receive our own or foreign advices, e.g. from telegram bot
stratCW.onAdvice = function (advice) {
    if (advice.origin === 'telegrambot' && advice.setconfig !== undefined) {
        if (advice.setconfig.slvalue !== undefined) this.t5coworker.slvalue = advice.setconfig.slvalue;
        if (advice.setconfig.tpvalue !== undefined) this.t5coworker.tpvalue = advice.setconfig.tpvalue;
    }
}


stratCW.update = function (candle) {
    //no need for strat update, we work with onCandle custom batching
}


stratCW.check = function (candle) {
   //no need for strat check, we work with onCandle custom batching and strat execution
}


module.exports = stratCW;
