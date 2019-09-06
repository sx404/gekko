const program = require('commander');
const fs = require('fs');
const log = require('../core/log.js');

var rsiOptimizer = {
    data: {}
}


rsiOptimizer.init = function(context) {
    this.enabled = context.settings.enableT5optimizer;
    this.limitT5optitrades = context.settings.limitT5optitrades;
    this.lastCheckedPrice = 100000;
    this.initialCurrency = 1000;

    try {
        this.data =  JSON.parse(fs.readFileSync(program['config'] + '.optimizer'));
        log.info('*** Runtime optimizer: Loading optimizer data from disk successfully!');
        this.getBestResults(true);
        log.info('*** Runtime optimizer: Best RSI is', this.data.buyTreshold, '/', this.data.sellTreshold, '(within the scope of last', context.settings.limitT5optitrades, 'trades)');
        //log.info('*** Runtime optimizer: Best RSI for all recorded history trades:', this.best.totalBuyRsi, '/', this.best.totalSellRsi);
    } catch (error) {
        this.data = rsiOptimizer.data;
        for (let i=51; i<= 70; i++) {
            this.data['Buy'+i] = {};
        }
    
        for (let i=51; i<= 70; i++) {
            for (let j=30; j<= 50; j++) {
                this.data['Buy'+i]['Sell'+j] = { exposed: false, profit: 0, currency: this.initialCurrency, asset: 0, trades: [] };
            }
        }
        
        this.data.buyTreshold = context.settings.thresholds.RSIhigh;
        this.data.sellTreshold = context.settings.thresholds.RSIlow;
        log.info('*** Runtime optimizer: Started with blank trade history dataset!');  
        log.info('*** Runtime optimizer: Using initial RSI values', this.data.buyTreshold, '/', this.data.sellTreshold);
        //log.info('*** Runtime optimizer: Dynamically optimize strategy for the last', context.settings.limitT5optitrades,'trades');
    }

    //autosave optimizer data
    if (context.settings.enableT5optifilesave) {
        setInterval(() => {
            try {
                fs.writeFile(program['config'] + '.optimizer', JSON.stringify(this.data, null, 2), () => {});
            } catch (error) {
                console.log(error);
            }
        }, 5000);
    }
}


rsiOptimizer.logPossibleSells = function(rsi, price, start) {
    if (this.enabled === false) return;

    for (let i=51; i<= 70; i++) {
        for (let j=30; j<= 50; j++) {
            if (j > rsi && this.data['Buy'+i]['Sell'+j].exposed == true) {
                let curTrade = {
                    type: 'sell',
                    price: price,
                    date: start,
                    profit: 0
                }
                this.data['Buy'+i]['Sell'+j].exposed = false;
                this.data['Buy'+i]['Sell'+j].currency = this.data['Buy'+i]['Sell'+j].asset * price;
                this.data['Buy'+i]['Sell'+j].asset = 0;
                let lastProfit = this.data['Buy'+i]['Sell'+j].currency / this.data['Buy'+i]['Sell'+j].lastCurrency;
                curTrade.profit = lastProfit >= 1 ? (lastProfit-1)*100 : (1-lastProfit)*(-100);
                
                let overallProfit = this.data['Buy'+i]['Sell'+j].currency / this.initialCurrency;
                this.data['Buy'+i]['Sell'+j].profit = overallProfit >= 1 ? (overallProfit-1)*100 : (1-overallProfit)*(-100);
                this.data['Buy'+i]['Sell'+j].trades.push(curTrade);
            }
        }
    }

    //calc new, best rsi results when the price has moved 10% from the last check
    /*
    let pricediff = Math.abs(this.lastCheckedPrice - price) / price;

    if (pricediff > 0.01) {
        this.lastCheckedPrice = price;
        this.getBestResults();
    }
    */
}


rsiOptimizer.logPossibleBuys = function(rsi, price, start) {
    if (this.enabled === false) return;

    for (let i=51; i<= 70; i++) {
        if (rsi > i) {
            for (let j=30; j<= 50; j++) {
                if (this.data['Buy'+i]['Sell'+j].exposed == false) {
                    let curTrade = {
                        type: 'buy',
                        price: price*-1,
                        date: start
                    }
                    this.data['Buy'+i]['Sell'+j].exposed = true;
                    this.data['Buy'+i]['Sell'+j].asset = this.data['Buy'+i]['Sell'+j].currency / price;
                    this.data['Buy'+i]['Sell'+j].lastCurrency = this.data['Buy'+i]['Sell'+j].currency;
                    this.data['Buy'+i]['Sell'+j].currency = 0;
                    this.data['Buy'+i]['Sell'+j].trades.push(curTrade);
                }
            }
        }
    }
}


rsiOptimizer.getBestResults = function(forceCalc) {
    this.best = {
        totalProfit: 0,
        buyRsi: 51,
        sellRsi: 30,
    };
    for (var i=51; i<= 70; i++) {
        for (var j=30; j<= 50; j++) {
            if (this.data['Buy'+i]['Sell'+j].profit >= this.best.totalProfit) {
                this.best.totalProfit = this.data['Buy'+i]['Sell'+j].profit;
                this.best.buyRsi = i;
                this.best.sellRsi = j;
                this.best.changed = true;
            }
        }
    }

    if (forceCalc) {
        this.data.buyTreshold = this.best.buyRsi;
        this.data.sellTreshold = this.best.sellRsi;
    }

    if (this.best.changed && this.data.buyTreshold !== this.best.buyRsi && this.data.sellTreshold !== this.best.sellRsi) {
        this.best.changed = false;
        
        //change rsi params dynamically when optimized enough trades
        var tLength = this.data['Buy'+this.best.buyRsi]['Sell'+this.best.sellRsi].trades.length;
        if (forceCalc || tLength >= this.limitT5optitrades-2) {
            this.data.buyTreshold = this.best.buyRsi;
            this.data.sellTreshold = this.best.sellRsi;
            console.log('*** Runtime optimizer: Changing strategy RSIs to', this.data.buyTreshold, '/', this.data.sellTreshold);
        }
        else {
            console.log('*** Runtime optimizer: Best strategy RSIs during last', tLength, 'trades (but not applied yet)',  this.best.buyRsi, '/',  this.best.sellRsi);
        }
    }
}


rsiOptimizer.shouldBuy = function(rsi, price) {
    if (rsi > this.data.buyTreshold)
        return true;
    else   
        return false;
}


rsiOptimizer.shouldSell = function(rsi, price) {
    if (rsi < this.data.sellTreshold)
        return true;
    else   
        return false;
}

module.exports = rsiOptimizer;