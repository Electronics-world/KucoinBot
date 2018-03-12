const Price = require('../models/Price');
const moment = require('moment');
const BB = require('technicalindicators').BollingerBands;
const EMA = require('technicalindicators').EMA;
const SMA = require('technicalindicators').SMA;
const RSI = require('technicalindicators').RSI;

exports.onPrices = async (price) => {
    const oneDayAgo = moment().subtract(1, 'days').toDate();

    const dayAverage = await Price.getMoy({ start: oneDayAgo })
    const dayMax = await Price.getMax({ start: oneDayAgo })
    const dayMin = await Price.getMin({ start: oneDayAgo })
    const dayMedian = await Price.getMedian({ start: oneDayAgo });
    const dayRange = await Price.getRange({ start: oneDayAgo });

    console.log('')
    console.log('Moyenne : ' + dayAverage)
    console.log('Max : ' + dayMax)
    console.log('Min : ' + dayMin)
    console.log('Median : ' + dayMedian)
    console.log('Current : ' + price.spot)
    console.log('Range : ' + dayRange)
    console.log('')
}

exports.getBollinger = async function ({ start, end = Date() } = {}) {
    const prices = await Price.getRange({ start, end });

    const total = prices.length;

    const input = {
        period: total,
        values: prices,
        stdDev: 1.62
    }

    const outcome = BB.calculate(input);
    return outcome
}

exports.RSI = async function ({ start, end = Date() } = {}) {
    const prices = await Price.getRange({ start, end });
    const total = prices.length
    const outcome = RSI.calculate({ period: total - 1, values: prices });
    return outcome.pop();
}

exports.SMA = async function ({ start, end = Date() } = {}) {
    const prices = await Price.getRange({ start, end });
    const total = prices.length;
    const outcome = SMA.calculate({ period: total, values: prices })
    return outcome[0];
}

exports.EMA = async function ({ start, end = Date() } = {}) {
    const prices = await Price.getRange({ start, end });
    const total = prices.length;
    const outcome = EMA.calculate({ period: total, values: prices })
    return outcome;
}