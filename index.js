const pricing = require('./src/pricing');
const database = require('./src/database');
const util = require('util');
const Price = require('./src/models/Price');
const moment = require('moment');
const Trading = require('./src/trading');
const Kucoin = require('kucoin-api');
const config = require('./src/configuration')

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const http = require('http');
const server = http.createServer(app);

const setTimeoutPromise = util.promisify(setTimeout);

app.use(bodyParser.json())

const time = 5 * 1000;
const currency = 'BTC-USDT';
var allIn = false;
var transactions = [];
var achat = 100000;
var target = 0;
var i = 0; // inactif pendant les 14 premieres minutes
var autoriseToTrade = false;

const mainLoop = async () => {

    try {

        let kc = new Kucoin(config.get('KUCOIN_API_KEY'), config.get('KUCOIN_API_SECRET'));
        console.log('')
        console.log('----------')
        console.log('')
        const pricesToSave = await pricing.getPrices();
        const priceSaved = await Price.create(pricesToSave);
        console.log('Price : '+priceSaved.spot);
        const RSI = await Trading.RSI({ start: moment().subtract(15 * 1, 'minutes').toDate() });
        console.log('RSI : ' + RSI)
        const Bollinger = await Trading.getBollinger({ start: moment().subtract(15 * 1, 'minutes').toDate() })
        const EMA12 = await Trading.EMA({ start: moment().subtract(12 * 1, 'minutes').toDate() })
        const EMA26 = await Trading.EMA({ start: moment().subtract(26 * 1, 'minutes').toDate() })
        console.log('EMA12 : ' + EMA12);
        console.log('EMA26 : ' + EMA26);
        /*if (EMA12 > EMA26) {
            console.log('EMA 12 > EMA 26   Haussier');
            
        } else {
            console.log('EMA 26 > EMA 12   Baissier');
           
        }*/

        target = (achat + achat * 0.008);
        if (allIn) {
            console.log('Target : ' + target);

        } else {
 
        }

        if (i > 168 && !allIn && RSI < 31.5) {
            achat = priceSaved.spot;
            transactions.push({ 'Ordre': 'Achat', 'Value': priceSaved.spot, 'EMA12': EMA12[0], 'EMA26': EMA26[0] });
            allIn = true;
            if (autoriseToTrade) {
                kc.getBalance({
                    symbol: 'USDT'
                }).then((result) => {
                    balanceUSDT = result.data.balance
                    console.log(balanceUSDT)
                    kc.createOrder({
                        pair: currency,
                        amount: balanceUSDT / (priceSaved.spot),
                        price: (priceSaved.spot),
                        type: 'BUY'
                    }).then(console.log).catch(console.error)
                }).catch((err) => {
                    console.log(err)
                })
            }
        }

        if (allIn && target < priceSaved.spot) {
            transactions.push({ 'Ordre': 'Revente', 'Value': priceSaved.spot, 'EMA12': EMA12[0], 'EMA26': EMA26[0] });
            allIn = false;
            if (autoriseToTrade) {
                kc.getBalance({
                    symbol: 'BTC'
                }).then((result) => {
                    balanceBTC = result.data.balance
                    console.log(balanceBTC)
                    kc.createOrder({
                        pair: currency,
                        amount: balanceBTC,
                        price: priceSaved.spot,
                        type: 'SELL'
                    }).then(console.log).catch(console.error)
                }).catch((err) => {
                    console.log(err)
                })
            }
        }

        if (allIn && priceSaved.spot < transactions[transactions.length - 1].Value * 0.98) {
            transactions.push({ 'Ordre': 'Revente Perte', 'Value': priceSaved.spot, 'EMA12': EMA12[0], 'EMA26': EMA26[0] });
            allIn = false;
            if (autoriseToTrade) {
                kc.getBalance({
                    symbol: 'BTC'
                }).then((result) => {
                    balanceBTC = result.data.balance
                    console.log(balanceBTC)
                    kc.createOrder({
                        pair: currency,
                        amount: balanceBTC,
                        price: priceSaved.spot,
                        type: 'SELL'
                    }).then(console.log).catch(console.error)
                }).catch((err) => {
                    console.log(err)
                })
            }
        }

        console.log('')
        console.log(transactions);

        i++;

    } catch (error) {

        console.log(error);

    }
}

let kc = new Kucoin(config.get('KUCOIN_API_KEY'), config.get('KUCOIN_API_SECRET'));
kc.getBalance({
    symbol: 'BTC'
}).then((result) => {
    console.log('BTC : ' + result.data.balance)
}).catch((err) => {
    console.log(err)
})
kc.getBalance({
    symbol: 'USDT'
}).then((result) => {
    console.log('USDT : ' + result.data.balance)
}).catch((err) => {
    console.log(err)
})

pricing.setCurrency(currency);
database.connect();
setInterval(mainLoop, time);
mainLoop();

if (autoriseToTrade) {
    console.log('Trade avec argent')
} else {
    console.log('Trade sans argent')
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/transactions', (req, res) => {
    res.send(transactions);
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on : ' + PORT))