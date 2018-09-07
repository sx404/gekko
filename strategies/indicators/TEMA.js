// required indicators
var EMA = require('./EMA.js');

var Indicator = function(config) {
  this.input = 'price';
  this.result = false;
  this.ema = new EMA(config.weight);
  this.ema2 = new EMA(config.weight);
  this.ema3 = new EMA(config.weight);
}

// add a price and calculate the EMAs and
// the result
Indicator.prototype.update = function (price) {
  this.ema.update(price);
  this.ema2.update(this.ema.result);
  this.ema3.update(this.ema2.result);
  this.result = 3 * this.ema.result - 3 * this.ema2.result + this.ema3.result;
}

module.exports = Indicator;
