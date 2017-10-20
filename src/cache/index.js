'use strict'

const consts = require('../../consts')
const crypto = require('crypto')

const cacheWrapper = {
    lookup: async (key, mongoDBcollection, logger)=>{
        const foundItem = await mongoDBcollection.findOne({key: key})
        if(foundItem===null){
            logger.warn({message: consts.LOG_CONSTANT_CACHE_MISS, value: key})
            const generatedItem = generateCacheItemForKey(key)
            await mongoDBcollection.insertOne(generatedItem)
            return generatedItem
        }
        return foundItem
    }
}

const generateCacheItemForKey = (key) => {
    return {
        key: key,
        val: crypto.randomBytes(10)+''
    }
}

module.exports = cacheWrapper
