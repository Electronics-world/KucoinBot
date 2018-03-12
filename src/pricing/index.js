const config = require('../configuration')
const request = require('request');

var currency = 'USDT-BTC'

module.exports = {
    setCurrency: (curr) => {
        currency = curr
    },
    getPrices: async function () {
        const currencyPair = currency

        const results = JSON.parse(await this.getTicker());

        const data = {
            market: currencyPair,
            buy: results.data.buy,
            sell: results.data.sell,
            spot: results.data.lastDealPrice,
            time: Date()
        }

        return data
    },
    getTicker: async () => new Promise((resolve, reject) => {
        const currencyPair = currency;
        request('https://api.kucoin.com/v1/open/tick?symbol=' + currencyPair, function (error, response, body) {
            //console.log('Status:', response.statusCode);
            //console.log('Headers:', JSON.stringify(response.headers));
            //console.log('Response:', body);
            error ? reject(error) : resolve(body);
        });
    })
}