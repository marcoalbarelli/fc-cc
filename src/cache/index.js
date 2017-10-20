'use strict'

const consts = require('../../consts')
const config = require('../../config')
const crypto = require('crypto')
const moment = require('moment')

const cacheWrapper = {
    setupIndex: async (mongoDBcollection) => {
        await mongoDBcollection.createIndex({key: 'hashed'})
        await mongoDBcollection.createIndex({ttl: 1}, {expireAfterSeconds: 3600})
    },
    lookup: async (key, mongoDBcollection, logger)=>{
        const foundItem = await mongoDBcollection.findOne({key: key})
        if(foundItem===null){
            logger.warn({message: consts.LOG_CONSTANT_CACHE_MISS, key: key})
            const generatedItem = generateCacheItemForKey(key)
            await cleanExceedingItems(mongoDBcollection)
            await mongoDBcollection.save(generatedItem)
            logger.warn({message: consts.LOG_CONSTANT_CACHE_GENERATED, key: key, val: generatedItem.val})
            return generatedItem
        }
        logger.info({message: consts.LOG_CONSTANT_CACHE_HIT, key: key})
        const a = moment(foundItem.ttl);
        if(moment().isSameOrAfter(a)) {
            foundItem.val = generateRandomString(20)
            await cleanExceedingItems(mongoDBcollection)
            await mongoDBcollection.save(foundItem)
            logger.info({message: consts.LOG_CONSTANT_CACHE_TTL_EXPIRED, key: key, val: foundItem.val})
        }

        return foundItem
    },
    update: async (key, mongoDBcollection, logger, value)=>{
        const generatedItem = generateCacheItemForKey(key, value)
        await cleanExceedingItems(mongoDBcollection)
        await mongoDBcollection.save(generatedItem)
        logger.warn({message: consts.LOG_CONSTANT_CACHE_GENERATED, key: key, val: generatedItem.val})
        return generatedItem
    },
    remove: async (key, mongoDBcollection, logger)=>{
        const foundItem = await mongoDBcollection.findOne({key: key})
        if(foundItem) {
            await mongoDBcollection.remove(foundItem)
            logger.warn({message: consts.LOG_CONSTANT_CACHE_REMOVED, key: key})
            return true
        }
        return false
    },
}

const cleanExceedingItems = async (mongoDBcollection) => {

    /**
     * Premature optimization is the root of all evil (or at least most of it) in programming.
     *  - Donald Knuth
     *
     * Since we don't yet know what we're facing let's keep it simple
     * - find the items exceeding the limit
     * - delete the oldest entries exceeding the max amount (if any)
     *
     * Hopefully it should be fast enough for a first attempt and then firing up a profiler f it isn't
     */

    const itemsToDelete = await mongoDBcollection
        .find()
        .sort({ttl: -1})
        .skip(config.ttl.maxItems - 1)
        .toArray()

    if(itemsToDelete.length > 0) {
        const ids = itemsToDelete.map((e) => {
            return {'deleteOne': {'filter': {'_id': e._id}}}
        })

        return await mongoDBcollection.bulkWrite(ids)
    }

    return null
}

const generateCacheItemForKey = (key, value = null) => {
    return {
        key: key,
        val: value || generateRandomString(),
        ttl: moment().add(config.ttl.quantity,config.ttl.type).toDate()
    }
}

const generateRandomString = (len = 10) =>{
    return crypto.randomBytes(len)+''
}

module.exports = cacheWrapper
