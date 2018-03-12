const mongoose = require('mongoose');
const { Schema } = mongoose;
const moment = require('moment');

const PriceSchema = new Schema({
    market: {
        type: String,
        required: true
    },
    buy: {
        type: Number,
        required: true
    },
    sell: {
        type: Number,
        required: true
    },
    spot: {
        type: Number,
        required: true
    },
    time: {
        type: Date,
        default: moment().toDate(),
        index: true,
        required: true
    }
})

PriceSchema.statics.getRange = async function ({ start, end = Date() } = {}) {
    const prices = await Price.find({ time: { $gte: start, $lte: end } });
    return prices.map(price => price.spot);
}

const Price = mongoose.model('Price', PriceSchema);
module.exports = Price;