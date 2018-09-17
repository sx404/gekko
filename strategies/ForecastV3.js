var _ = require('lodash');
var log = require('../core/log.js');
const util = require('../core/util');
const TULIPASYNC = require('../strategies/indicators/TulipAsync.js');
const TALIBASYNC = require('../strategies/indicators/TalibAsync.js');


function getScale(val) {
  if (isNaN(val) || val === null || val === undefined || val === 0) {
    return 1;
  } else if (Math.abs(val) >= 1) {
    return Math.pow(10, Math.trunc(val).toString().length - 3);
  } else {
    return Math.pow(10, Math.abs(val).toString().match(/0\.0?/)[0].length + 1);
  }
}


var strat = {};

strat.init = function () {
  this.name = 'Forecast';
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  }

  this.Scale = null;
  this.Period = 13;

  this.requiredHistory = this.tradingAdvisor.historySize;
  //this.addTulipIndicator('fosc', 'fosc', { optInTimePeriod: this.Period });
  //this.addTalibIndicator('ht_dcperiod', 'ht_dcperiod', {});
  //this.addTalibIndicator('ht_trendline', 'ht_trendline', {});
  //this.addTulipIndicator('msw', 'msw', { optInTimePeriod: this.Period });
  //this.addTulipIndicator('tsf', 'tsf', { optInTimePeriod: this.Period });

  this.tulipFOSC = new TULIPASYNC({ indicator: 'fosc', length: 500, candleinput: 'close', options:[ this.Period ] });
  this.talibHTDCPERIOD = new TALIBASYNC({ indicator: 'ht_dcperiod', length: 500, options:[ this.Period ] });
  this.talibHTTRENDLINE = new TALIBASYNC({ indicator: 'ht_trendline', length: 500, options:[ this.Period ] });
  this.tulipMSW = new TULIPASYNC({ indicator: 'msw', length: 500, candleinput: 'close', options:[ this.Period ] });
  this.tulipTSF = new TULIPASYNC({ indicator: 'tsf', length: 500, candleinput: 'close', options:[ this.Period ] });
}


strat.update = async function (candle) {
  if (!this.Scale) 
     this.Scale = getScale(candle.close);

  //this.Period = Math.round(this.talibIndicators.ht_dcperiod.result['outReal']);
  //this.ht_trendline = Math.round(this.talibIndicators.ht_trendline.result['outReal'] * this.Scale) / this.Scale;
  //this.fosc = Math.round(this.tulipIndicators.fosc.result['result'] * this.Scale) / this.Scale;
  //this.mswSine = Math.round(this.tulipIndicators.msw.result['mswSine'] * this.Scale) / this.Scale;
  //this.mswLead = Math.round(this.tulipIndicators.msw.result['mswLead'] * this.Scale) / this.Scale;
  //this.tsf = Math.round(this.tulipIndicators.tsf.result['result'] * this.Scale) / this.Scale;

  
  this.talibHTDCPERIOD.result = await this.talibHTDCPERIOD.update(candle);
  this.Period = Math.round(this.talibHTDCPERIOD.result);

  this.talibHTTRENDLINE.result = await this.talibHTTRENDLINE.update(candle);
  this.ht_trendline = Math.round(this.talibHTTRENDLINE.result * this.Scale) / this.Scale;
  
  this.tulipFOSC.result = await this.tulipFOSC.update(candle);
  this.fosc = Math.round(this.tulipFOSC.result[0] * this.Scale) / this.Scale;

  this.tulipMSW.result = await this.tulipMSW.update(candle);
  this.mswSine = Math.round(this.tulipMSW.result[0] * this.Scale) / this.Scale;
  this.mswLead = Math.round(this.tulipMSW.result[1] * this.Scale) / this.Scale;

  this.tulipTSF.result = await this.tulipTSF.update(candle);
  this.tsf = Math.round(this.tulipTSF.result[0] * this.Scale) / this.Scale;
}


strat.loggg = function (candle) {
  log.info('\t\r')
  log.info('\t', 'close:', candle.close)
  log.info('\t', 'Forecast Oscillator:', this.fosc)
  log.info('\t', 'Modified Sine Wave:', this.mswSine, this.mswLead)
  log.info('\t', 'Trendline:', this.ht_trendline)
  log.info('\t', 'Time Series Forecast:', this.tsf)
  log.info('\t\r')
}


strat.check = function (candle) {  
  const all_long = [
    //this.mswSine > this.mswLead,
    this.tsf > this.ht_trendline && typeof(this.tsf) === typeof(this.ht_trendline),
    this.fosc > 1,
    this.trend.direction !== 'long'
  ].reduce((total, long) => long && total, true)

  const all_short = [
    //this.mswSine < this.mswLead,
    this.tsf < this.ht_trendline && typeof(this.tsf) === typeof(this.ht_trendline),
    //this.fosc < -0.5,
    this.trend.direction !== 'short'
  ].reduce((total, short) => short && total, true)

  if (all_long) {
    if (this.trend.direction !== 'long')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'long',
        adviced: false
      }
    this.trend.duration++
    log.debug('In uptrend since', this.trend.duration, 'candle(s)')
    if (this.trend.duration >= 1)
      this.trend.persisted = true
    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    }
  } else if (all_short) {
    if (this.trend.direction !== 'short')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'short',
        adviced: false
      }
    this.trend.duration++;
    log.debug('In downtrend since', this.trend.duration, 'candle(s)')
    if (this.trend.duration >= 1)
      this.trend.persisted = true;
    if (this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    }
  }
}

module.exports = strat;