var util = require('../../core/util');
var _ = require('lodash');
var fs = require('fs');
var toml = require('toml');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

var config = util.getConfig();
var dirs = util.dirs();
var log = require(dirs.core + 'log');
var CandleBatcher = require(dirs.core + 'candleBatcher');

var moment = require('moment');
var isLeecher = config.market && config.market.type === 'leech';

var Actor = function(done) {
  _.bindAll(this);

  this.done = done;

  this.batcher = new CandleBatcher(config.tradingAdvisor.candleSize);

  this.strategyName = config.tradingAdvisor.method;

  this.setupStrategy(function() {
    var mode = util.gekkoMode();

    // the stitcher will try to pump in historical data
    // so that the strat can use this data as a "warmup period"
    //
    // the realtime "leech" market won't use the stitcher
    if(mode === 'realtime' && !isLeecher) {
      var Stitcher = require(dirs.tools + 'dataStitcher');
      var stitcher = new Stitcher(this.batcher);
      stitcher.prepareHistoricalData(done);
    } else
      done();
    });
}

Actor.prototype.setupStrategy = async function(cb) {

  if(!fs.existsSync(dirs.methods + this.strategyName + '.js'))
    util.die('Gekko can\'t find the strategy "' + this.strategyName + '"');

  log.info('\t', 'Using the strategy: ' + this.strategyName);

  const strategy = require(dirs.methods + this.strategyName);

  // bind all trading strategy specific functions
  // to the WrappedStrategy.
  const WrappedStrategy = require('./baseTradingMethod');

  _.each(strategy, function(fn, name) {
    WrappedStrategy.prototype[name] = fn;
  });

  let stratSettings;
  if(config[this.strategyName]) {
    stratSettings = config[this.strategyName];
  }

  this.strategy = new WrappedStrategy(stratSettings);
  if (WrappedStrategy.prototype['init'] instanceof AsyncFunction) {
    await this.strategy.init();
  }
  else {
    this.strategy.init();
  }

  this.strategy
    .on('advice', this.relayAdvice)
    .on(
      'stratWarmupCompleted',
      e => this.deferredEmit('stratWarmupCompleted', e)
    )
    .on(
      'stratUpdate',
      e => this.deferredEmit('stratUpdate', e)
    ).on('stratNotification',
      e => this.deferredEmit('stratNotification', e)
    )

  this.strategy
    .on('tradeCompleted', this.processTradeCompleted);

  this.batcher
    .on('candle', _candle => {
      const { id, ...candle } = _candle;
      this.deferredEmit('stratCandle', candle);
      this.emitStratCandle(candle);
    });

  cb();
}

// HANDLERS
// process the 1m candles
Actor.prototype.processCandle = async function(candle, done) {
  this.candle = candle;

  //strategy developers can implement their ONCANDLE function with or without async
  if (this.strategy.onCandle instanceof AsyncFunction) {
    await this.strategy.onCandle(candle);
  }
  else {
      this.strategy.onCandle(candle);
  }

  const completedBatch = this.batcher.write([candle]);
  if(completedBatch) {
    this.next = done;
  } else {
    done();
    this.next = false;
  }
  this.batcher.flush();
}

// propogate a custom sized candle to the trading strategy
Actor.prototype.emitStratCandle = function(candle) {
  const next = this.next || _.noop;
  this.strategy.tick(candle, next);
}

Actor.prototype.processTradeCompleted = function(trade) {
  this.strategy.processTrade(trade);
}

// pass through shutdown handler
Actor.prototype.finish = function(done) {
  this.strategy.finish(done);
}

// EMITTERS
Actor.prototype.relayAdvice = function(advice) {
  advice.date = this.candle.start.clone().add(1, 'minute');
  this.deferredEmit('advice', advice);
}


module.exports = Actor;
