'use strict'

const mongo = {
    hostname: process.env.MONGO_DB_HOST || 'localhost',
    port: process.env.MONGO_DB_PORT || 3000,
    db: process.env.MONGO_DB_NAME || 'fc_cache',
    collection: process.env.MONGO_DB_COLLECTION || 'cache_items',
    propName: '_mongoConn',
}

const ttl = {
    quantity: parseInt(process.env.TTL_PERIOD_QUANTITY ||  1, 10),
    type: process.env.TTL_PERIOD_TYPE ||  'day',
    maxItems: parseInt(process.env.MAX_CACHE_ITEMS || 10000, 10),
}

const mongoConnectionUrl = ()=>{return `mongodb://${mongo.hostname}:${mongo.port}/${mongo.db}`}

module.exports.mongo = mongo

module.exports.mongoConnectionUrl = mongoConnectionUrl()

module.exports.ttl = ttl
