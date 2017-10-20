'use strict'

const mongo = {
    hostname: process.env.MONGO_DB_HOST || 'localhost',
    port: process.env.MONGO_DB_PORT || 3000,
    db: process.env.MONGO_DB_NAME || 'fc_cache',
    collection: process.env.MONGO_DB_COLLECTION || 'cache_items',
}

const mongoConnectionUrl = ()=>{return `mongodb://${mongo.hostname}:${mongo.port}/${mongo.db}`}

module.exports.mongo = mongo

module.exports.mongoConnectionUrl = mongoConnectionUrl()
