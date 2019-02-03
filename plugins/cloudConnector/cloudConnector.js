const _ = require('lodash');
const log = require('../../core/log.js');
const Connection = require('./connection.js');

const Connector = function(done) {
    _.bindAll(this);
    this.mycon = new Connection();
    this.mycon.registerListener(this.onRemoteCandle, this.onRemoteAdvice);
    done();
};


// *********************************************************
// *** handle Gekko Cloud events
Connector.prototype.onRemoteCandle = function(remoteCandle) {
    this.emit('remoteCandle', remoteCandle);
};


Connector.prototype.onRemoteAdvice = function (remoteAdvice) {
    remoteAdvice.advice.direction = remoteAdvice.advice.recommendation;
    this.emit('remoteAdvice', remoteAdvice);
};


// *********************************************************
// *** attach to core events
Connector.prototype.processCandle = function(candle, done) {
    this.mycon.publishCandle(candle);
    done();
};

Connector.prototype.processAdvice = function(advice) {
    if (advice.recommendation === 'soft') return;
    //if (advice.origin !== undefined && advice.origin === 'telegrambot') return;
    if (advice.recommendation === undefined) return;

    this.mycon.publishAdvice(advice);
};
  
Connector.prototype.finish = async function(next) {
    await this.mycon.exit();
    next();
}

module.exports = Connector;