var Ccxt = require('ccxt');
var ccxtError = require('../node_modules/ccxt/js/base/errors.js');

var deasync = require('deasync');

var util = require('../core/util.js');
var Errors = require('../core/error');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

process.on ('uncaughtException',  e => { console.log (e); process.exit (1) })
process.on ('unhandledRejection', e => { console.log (e); process.exit (1) })

// Helper methods
function joinCurrencies(currencyA, currencyB){
    return currencyA + '/' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'HitBTC';
  
  this.balance;
  this.price;

  this.pair = [this.asset, this.currency].join('/');

  //var exchange = config.exchange.toLowerCase().substr(5);
  var exchange = 'hitbtc2';

  this.ccxt = new Ccxt[exchange]({apiKey: this.key, secret: this.secret, uid:this.username, password: this.passphrase});
  this.exchangeName = exchange;
  
  //Prefetch market
  var retFlag = false;
  (async () => {
     try{
        await this.ccxt.loadMarkets();
     }catch(e){
        retFlag = true;
        console.log('error loading markets : ' + this.name + '-' + this.exchangeName , e);
     }
     retFlag = true;
  }) ();
  deasync.loopWhile(function(){return !retFlag;});
}


var retryCritical = {
  retries: 10,
  factor: 1.2,
  minTimeout: 1 * 1000,
  maxTimeout: 30 * 1000
};

var retryForever = {
  forever: true,
  factor: 1.2,
  minTimeout: 10,
  maxTimeout: 30
};

/** CCXT Error
ExchangeError -> Retry
NotSupported -> Abort
AuthenticationError -> Abort
InvalidNonce -> Retry
InsufficientFunds -> Retry
InvalidOrder -> Abort
OrderNotFound -> Abort                                                                             
OrderNotCached -> Abort
CancelPending -> Abort
NetworkError -> Retry
DDoSProtection -> Retry
RequestTimeout -> Retry
ExchangeNotAvailable-> Retry
*/
Trader.prototype.processError = function(funcName, error) {
  if (!error) return undefined;

  //Handle error here
  if(error instanceof ccxtError.ExchangeError       ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.NotSupported        ){
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.AuthenticationError ){
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.InvalidNonce        ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.InsufficientFunds   ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.InvalidOrder        ){
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.OrderNotFound       ){  
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  																   
  }else if(error instanceof ccxtError.OrderNotCached      ){
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.CancelPending       ){
    log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
    return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.NetworkError        ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.DDoSProtection      ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message); 	
  }else if(error instanceof ccxtError.RequestTimeout      ){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);  	
  }else if(error instanceof ccxtError.ExchangeNotAvailable){
    log.debug(`[ccxt-${this.exchangeName}] (${funcName}) returned an error, retrying: ${error.message}`);
    return new Errors.RetryError('[ccxt-'+ this.exchangeName + '] ' + error.message);    
  }else{
	log.error(`[ccxt-${this.exchangeName}] (${funcName}) returned an irrecoverable error: ${error.message}`);
	return new Errors.AbortError('[ccxt-'+ this.exchangeName + '] ' + error.message);
  }
};

Trader.prototype.handleResponse = function(funcName, callback) {
  return (error, body) => {
    if(!error) {
      if(_.isEmpty(body))
        error = new Error('NO DATA WAS RETURNED');
    }

    return callback(this.processError(funcName, error), body);
  }
};

Trader.prototype.Portfolio = function(callback) {

  var processAttempt = function(ccxt, cb) {
     
     (async () => {
       try{
          data = await ccxt.fetchBalance();
          cb(undefined, data);  
       }catch(e){
		  log.error(e);
          cb(e);
       }
	 }) ();
  };
  
  var processResult = function (err, data){
	 if(err) return callback(err);
	 var assetAmount = data[this.asset]['free'];
	 var currencyAmount = data[this.currency]['free'];
     
	 if(!_.isNumber(assetAmount) || _.isNaN(assetAmount)) {
       log.error(`[ccxt-${this.exchangeName}] did not return portfolio for ${this.asset}, assuming 0.`);
       assetAmount = 0;
     }

     if(!_.isNumber(currencyAmount) || _.isNaN(currencyAmount)) {
       log.error(`[ccxt-${this.exchangeName}] did not return portfolio for ${this.currency}, assuming 0.`);
       currencyAmount = 0;
     }
     
	 var portfolio = [
	 { name: this.asset, amount: assetAmount },
	 { name: this.currency, amount: currencyAmount }
	 ];
     
	 log.debug('[ccxt-' + this.exchangeName + '] (getPortfolio) portfolio:', portfolio);
	 callback(undefined, portfolio);     
  };
  
  let handler = (cb) => processAttempt(this.ccxt, this.handleResponse('getPortfolio', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResult, this));  
}

Trader.prototype.getTicker = function(callback) {

  var processAttempt = function(ccxt, pair, cb) {
	  
     (async () => {
       try{
          data = await ccxt.fetchTicker(pair);
	      cb(undefined, data);
       }catch(e){
		  log.error(e);
	      cb(e);
       }
	 }) ();
  }
  
  var processResult = function (err, data){
	 if(err) return callback(err);
	 log.debug('ask', parseFloat(data['ask']), 'bid', parseFloat(data['bid']));
	 
	 log.debug('[ccxt-' + this.exchangeName + '] (getTicker) ask', parseFloat(data['ask']), 'bid', parseFloat(data['bid']));
     callback(undefined, {
	    bid: parseFloat(data['bid']),
	    ask: parseFloat(data['ask']),
     });
  }
  
  let handler = (cb) => processAttempt(this.ccxt, this.pair, this.handleResponse('getTicker', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResult, this));  
}

Trader.prototype.getFee = function(callback) {
   //getFee is WIP ccxt side 
   //See https://github.com/ccxt/ccxt/issues/640
   try{
      var fee = parseFloat(this.ccxt.markets[this.pair]['maker']);
      if(!_.isNumber(fee) || _.isNaN(fee)){
         fee = 0.0025; //default
      }
   }catch(e){
      var fee = 0.0025; //default
   }
   callback(undefined, fee);
}

Trader.prototype.buy = function(amount, price, callback) {

   var processAttempt = function(ccxt, amount, price, pair, cb) {
     
     (async () => {
	   //getFee
	   try{
		  var fee = parseFloat(this.ccxt.markets[this.pair]['maker']);
		  if(!_.isNumber(fee) || _.isNaN(fee)){
			 fee = 0.0025; //default
		  }
	   }catch(e){
		  var fee = 0.0025; //default
	   }	   

	   //Calculate fee
	   try{
		 var calculateFee = (amount * fee);
	   }catch(e){
		  var calculateFee = 0;
	   }
	   //Round amount
       try{
         var roundAmount = ccxt.amountToLots(pair, (amount - calculateFee));
       }catch(e){
           try{
             var roundAmount = ccxt.amountToPrecision(pair, (amount - calculateFee));
          }catch(e){
             var roundAmount = (amount - calculateFee);
          }           
       }
       //Round price
       try{
          var roundPrice = ccxt.priceToPrecision(pair, price);
       }catch(e){
          var roundPrice = price;
       }     
       
       log.debug('(buy) Rounded price and amount are : ', roundAmount, 'at', roundPrice, 'with', calculateFee, 'fees', '(', pair, ')'); 
       
	   try{
		   data = await ccxt.createLimitBuyOrder (pair, roundAmount, roundPrice);
		   cb(undefined, data);
       }catch(e){
		  log.error(e);
	      cb(e);
       }
     }) ();
  };
  
  var processResult = function (err, data){
    if(err) return callback(err);
    
    var txid = data['id'];
    log.debug('[ccxt-' + this.exchangeName + '] (buy) added order with txid:', txid);

    callback(undefined, txid);
  };	  
	  
  let handler = (cb) => processAttempt(this.ccxt, amount, price, this.pair, this.handleResponse('buy', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(processResult, this));  
}

Trader.prototype.sell = function(amount, price, callback) {
   var processAttempt = function(ccxt, amount, price, pair, cb) {
     
     (async () => {
	   //getFee
	   try{
		  var fee = parseFloat(this.ccxt.markets[this.pair]['maker']);
		  if(!_.isNumber(fee) || _.isNaN(fee)){
			 fee = 0.0025; //% default
		  }
	   }catch(e){
		  var fee = 0.0025; //% default
	   }	
	   //Calculate fee
	   try{
		 var calculateFee = (amount * fee);
	   }catch(e){
		  var calculateFee = 0;
	   }
	   //Round amount
       try{
         var roundAmount = ccxt.amountToLots(pair, (amount - calculateFee));
       }catch(e){
           try{
             var roundAmount = ccxt.amountToPrecision(pair, (amount - calculateFee));
          }catch(e){
             var roundAmount = (amount - calculateFee);
          }           
       }
       //Round price
       try{
          var roundPrice = ccxt.priceToPrecision(pair, price);
       }catch(e){
          var roundPrice = price;
       }     
       
       log.debug('(sell) Rounded price and amount are : ', roundAmount, 'at', roundPrice, 'with', calculateFee, 'fees', '(', pair, ')'); 
       
	   try{
		   data = await ccxt.createLimitSellOrder (pair, roundAmount, roundPrice);
		   cb(undefined, data);
       }catch(e){
		  log.error(e);
	      cb(e);
       }
     }) ();
  };
  
  var processResult = function (err, data){
    if(err) return callback(err);
    
    var txid = data['id'];
	if(_.isUndefined(txid))
		txid = 0; //Order id is undefined, assuming order is already filled. See https://github.com/ccxt/ccxt/issues/660
    log.debug('[ccxt-' + this.exchangeName + '] (sell) added order with txid:', txid);

    callback(undefined, txid);
  };	  
	  
  let handler = (cb) => processAttempt(this.ccxt, amount, price, this.pair, this.handleResponse('sell', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(processResult, this));  
}

Trader.prototype.checkOrder = function(order, callback) {
   var processAttempt = function(ccxt, order, pair, cb) {
     
     (async () => {
	   try{
		   var data = await ccxt.fetchOrder(order, pair);
		   cb(undefined, data);
       }catch(e){
		  log.error(e);
		  if(e instanceof ccxtError.OrderNotCached)
			cb(undefined, {'status':'closed'});	//If no order found, then order is cancelled or filled.
		  else{
			cb(e);
		  }	      
       }
     }) ();
  };
  
  var processResult = function (err, data){
    if(err) return callback(err);
	
	log.debug('[ccxt-' + this.exchangeName + '] (checkOrder) result', data);
    callback(undefined, data['status'] === 'closed' ? true : false);
  };	  
	  
  let handler = (cb) => processAttempt(this.ccxt, order, this.pair, this.handleResponse('checkOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(processResult, this));  	
}

Trader.prototype.getOrder = function(order, callback) {
  var processAttempt = function(ccxt, pair, id, cb) {
     
     (async () => {
	   try{
		   if(ccxt['has']['fetchMyTrades'] === true){
			   var orders = await ccxt.fetchMyTrades(pair);
			   for (let i = 0; i < orders.length; i++) {
					if (orders[i]['id'] == id){
						cb(undefined, orders[i]);
					}
				}
				cb(undefined, {'timestamp':0, 'price':0, 'amount':0});	//If no order found, assuming already cancelled or filled.
		   }else{
			   var order = await ccxt.fetchOrder(id, pair);
			   cb(undefined, order);
		   }		   
       }catch(e){
		  log.error(e);
		  if(e instanceof ccxtError.OrderNotCached)
			cb(undefined, {'timestamp':0, 'price':0, 'amount':0});	//If no order found, assuming already cancelled or filled.
		  else
			cb(e);	      
       }
     }) ();
  };
  
  var processResult = function (err, data){
    if(err) return callback(err);
	
	log.debug('[ccxt-' + this.exchangeName + '] (getOrder) result', data);
	var date = moment(data['timestamp']);
    var price = data['price'];
    var amount = data['amount'];
    
    callback(undefined, {price, amount, date});	
  };	  
	  
  let handler = (cb) => processAttempt(this.ccxt, this.pair, order, this.handleResponse('getOrder', cb));
  util.retryCustom(retryCritical, _.bind(handler, this), _.bind(processResult, this));  	
}

Trader.prototype.cancelOrder = function(order, callback) {
  var processAttempt = function(ccxt, cb) {
     
     (async () => {
	   try{
		   var data = await ccxt.cancelOrder(order);
		   cb(undefined, data);
       }catch(e){
		  log.error(e);
		  if(e instanceof ccxtError.OrderNotFound)
			cb(undefined, 1);	//If no order found, then order is cancelled or filled.
		  else{
			cb(e);
		  }	  
       }
     }) ();
  };
  
  var processResult = function (err, data){
	 if(err) 
		return callback(err);

	 log.debug('[ccxt-' + this.exchangeName + '] (cancelOrder) result', data);
     callback(undefined, data);	
  };	
  
  let handler = (cb) => processAttempt(this.ccxt, this.handleResponse('cancelOrder', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResult, this));  	
}

Trader.prototype.getTrades = function(since, callback, descending) {

  var firstFetch = !!since;

  var processAttempt = function(ccxt, pair, since, cb) {
     
     (async () => {
	   try{
		   var data = await ccxt.fetchTrades(pair, since);
		   cb(undefined, data);
       }catch(e){
	      cb(e);
       }
     }) ();
  };
  
  var processResult = function (err, data){
    if(err) return callback(err);

	var result = _.map(data, function(trade) {
	     var uid;
	     //Exchange don't always return id
	     if(_.isUndefined(trade.id)){
			uid = trade.timestamp;
	     }else{
			uid = trade.id;
	     }
	     
	     return {
			tid: uid,
			amount: +trade.amount,
			date: moment.utc(trade.datetime).unix(),
			price: +trade.price
	     };
	});
	var retValue = undefined;
	if(result.length > 1){
	  for (let index = 0; index < result.length-1; ++index) {
		 if(result[index]['tid'] != result[index+1]['tid']){
			retValue = (result[index]['tid'] > result[index+1]['tid'] ? result.reverse() : result);
			break;
		 }
	  }
	}
	if(_.isUndefined(retValue)){
	  retValue = result; //There is only one trade or one timestamp
	}
	callback(null, retValue);
  };	
  
  let handler = (cb) => processAttempt(this.ccxt, this.pair, since, this.handleResponse('getTrades', cb));
  util.retryCustom(retryForever, _.bind(handler, this), _.bind(processResult, this));  	
}


//Dynamic getCapabilities - takes a while
Trader.getCapabilities = function () {
    var ccxtSlug = 'hitbtc2';
    var retFlag = false;
                                      
    if(_.isUndefined(ccxtSlug)){
       var ret = [];
       var ccxtExchanges = Ccxt.exchanges;
       for (var i = 0; i < ccxtExchanges.length; i++) {
          exchange = ccxtExchanges[i];
          let Trader = null;
          try {
            Trader = new Ccxt[exchange]();
          } catch (e) {
            console.log(e); 
            return;
          }
          
          var trader = Trader.describe();
          var capabilities = [];
          
          var arrPair = [];
          var arrAssets = [];
          var arrCurrencies = []
          var markets = null;
          
          if(Trader.hasPublicAPI){ //solve _1broker issue (don't have public API and atm API key is not entered).
             retFlag = false;
             (async () => {
                try{
                   markets = await Trader.loadMarkets();
                   console.log(trader.id + ' is load');
                }catch(e){
                   console.log('error loading : ' + trader.id);
                }
                retFlag = true;
             }) ();
             deasync.loopWhile(function(){return !retFlag;});
             arrPair = [];
             if(markets !== null){
                _.each(markets, market => {  
                   try{
                      var amountMin = market.limits.amount.min;
                   }catch(e){
                      var amountMin = 1e8;
                   }
                   arrPair.push({pair: [market.quote, market.base], minimalOrder: { amount: amountMin, unit: 'asset'}});  
                   if(arrAssets.toString().search(market.base) == -1){
                      arrAssets.push(market.base);
                   }
                   if(arrCurrencies.toString().search(market.quote) == -1){
                      arrCurrencies.push(market.quote);
                   }
                                         
                });
             }
          }
          if(markets !== null){
             capabilities = {
                name : trader.id, 
                slug: trader.id,
                currencies: arrCurrencies.sort(),
                assets: arrAssets.sort(),
                markets: arrPair.sort(function(a,b){
                   var sortTest = a.pair[0].localeCompare(b.pair[0]);
                   if (sortTest != 0){
                      return sortTest;
                   }else{
                      return a.pair[1].localeCompare(b.pair[1]);
                   }
                }),
                requires: ['key', 'secret'],
                tid: 'tid',
                providesHistory: 'date',
                providesFullHistory: Trader.fetchTrades ? true : false,
                tradable: Trader.hasPrivateAPI ? true : false,  
             };
             ret.push(capabilities);
          }
       }
       return ret;
    }else{
       let Trader = null;
       try {
         Trader = new Ccxt[ccxtSlug]();
       } catch (e) {
         console.log(e); 
         return;
       }
       
       var trader = Trader.describe();
       var capabilities = [];
       
       var arrPair = [];
       var arrAssets = [];
       var arrCurrencies = []
       var markets = null;
       
       if(Trader.hasPublicAPI){ //solve _1broker issue (don't have public API and atm API key is not entered).
          retFlag = false;
          (async () => {
             try{
                markets = await Trader.loadMarkets();
             }catch(e){
                return this.retry(this.getCapabilities, ccxtSlug);
             }
             retFlag = true;
          }) ();
          deasync.loopWhile(function(){return !retFlag;});
          arrPair = [];
          if(markets !== null){
             _.each(markets, market => {  
                try{
                   var amountMin = market.limits.amount.min;
                }catch(e){
                   var amountMin = 1e8;
                }
                arrPair.push({pair: [market.quote, market.base], minimalOrder: { amount: amountMin, unit: 'asset'}});  
                if(arrAssets.toString().search(market.base) == -1){
                   arrAssets.push(market.base);
                }
                if(arrCurrencies.toString().search(market.quote) == -1){
                   arrCurrencies.push(market.quote);
                }
                                      
             });
          }
       }
       if(markets !== null){
          capabilities = {
             name : trader.id, 
             slug: 'hitbtc2',
             currencies: arrCurrencies.sort(),
             assets: arrAssets.sort(),
             markets: arrPair.sort(function(a,b){
                var sortTest = a.pair[0].localeCompare(b.pair[0]);
                if (sortTest != 0){
                   return sortTest;
                }else{
                   return a.pair[1].localeCompare(b.pair[1]);
                }
             }),
             requires: ['key', 'secret'],
             tid: 'tid',
             providesHistory: 'date',
             providesFullHistory: Trader.fetchTrades ? true : false,
             tradable: Trader.hasPrivateAPI ? true : false,  
          };
       };
       return capabilities;
    }
}


module.exports = Trader;
