'use strict'

require('dotenv').config()

const cache = require('../src/cache')

const chai = require('chai')
const expect = chai.expect

const sinon = require('sinon')
const uuid = require('uuid')
const MongoClient = require('mongodb').MongoClient
const config = require('../config')

describe('Cache system',function(){

    it('performs a lookup on the DB for the requested key',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)
        const logger = setupMockLogger()
        const spy = sinon.spy(collection,'findOne')
        await cache.lookup(uuid.v4(), collection, logger)
        db.close()

        return expect(spy.callCount).to.be.equal(1)
    })
    it('logs a "Cache miss" on miss',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)

        const logger = setupMockLogger()
        const spy = sinon.spy(logger,'warn')
        await cache.lookup(uuid.v4(), collection, logger)
        db.close()

        return expect(spy.callCount).to.be.equal(1)
    })
    it('Updates the cache with a random string on miss',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)

        const logger = setupMockLogger()
        const randomCacheKey = uuid.v4()
        await cache.lookup(randomCacheKey, collection, logger)

        const generatedItem = await collection.findOne({key: randomCacheKey})

        db.close()

        return expect(generatedItem).to.have.property('val')
    })
    it('returns a random string on miss',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)

        const logger = setupMockLogger()
        const randomCacheKey = uuid.v4()
        await cache.lookup(randomCacheKey, collection, logger)

        const generatedItem = await collection.findOne({key: randomCacheKey})

        db.close()

        return expect(generatedItem.val).not.to.be.null
    })
})


const setupMockLogger=()=>{
    return {
        info: ()=>{

        },
        error: ()=>{

        },
        warn: ()=>{

        },
        debug: ()=>{

        },
        trace: ()=>{

        }
    }
}
