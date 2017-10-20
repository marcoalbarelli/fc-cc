'use strict'

require('dotenv').config()

const cache = require('../src/cache')

const chai = require('chai')
const expect = chai.expect
const moment = require('moment')
const sinon = require('sinon')
const uuid = require('uuid')
const MongoClient = require('mongodb').MongoClient
const config = require('../config')

describe('Cache system',function(){

    it('sets up indexes',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)
        const spy = sinon.spy(collection,'createIndex')
        await cache.setupIndex(collection)
        db.close()
        return expect(spy.callCount).to.be.equal(2)
    })
    it('performs a lookup on the DB for the requested key',async ()=>{
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)
        const logger = setupMockLogger()
        const spy = sinon.spy(collection,'findOne')
        await cache.lookup(uuid.v4(), collection, logger)
        db.close()

        return expect(spy.callCount).to.be.equal(1)
    })
    describe('when missing the item', ()=> {
        it('logs a "Cache miss" on miss', async () => {
            const db = await MongoClient.connect(config.mongoConnectionUrl)
            const collection = db.collection(config.mongo.collection)

            const logger = setupMockLogger()
            const spy = sinon.spy(logger, 'warn')
            await cache.lookup(uuid.v4(), collection, logger)
            db.close()

            return expect(spy.callCount).to.be.equal(2)
        })
        it('Updates the cache with a random string on miss', async () => {
            const db = await MongoClient.connect(config.mongoConnectionUrl)
            const collection = db.collection(config.mongo.collection)

            const logger = setupMockLogger()
            const randomCacheKey = uuid.v4()
            await cache.lookup(randomCacheKey, collection, logger)

            const generatedItem = await collection.findOne({key: randomCacheKey})

            db.close()

            return expect(generatedItem).to.have.property('val')
        })
        it('returns a random string on miss', async () => {
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
    describe('when hitting the item', ()=>{
        it('logs a "Cache hit" on hit', async () => {
            const db = await MongoClient.connect(config.mongoConnectionUrl)
            const collection = db.collection(config.mongo.collection)
            const cachedItem = {
                key: uuid.v4(),
                val: 'I\'ve been putting out fires with gasoline',
            }
            await collection.insertOne(cachedItem)

            const logger = setupMockLogger()
            const spy = sinon.spy(logger, 'info')
            await cache.lookup(cachedItem.key, collection, logger)
            db.close()

            return expect(spy.callCount).to.be.equal(2)
        })


        it('returns the found value on hit', async () => {
            const db = await MongoClient.connect(config.mongoConnectionUrl)
            const collection = db.collection(config.mongo.collection)
            const cachedItem = {
                key: uuid.v4(),
                val: 'I\'m up on the eleventh floor and I\'m watching the cruisers below',
                ttl: moment().add(1000,'days').toDate()
            }
            await collection.insertOne(cachedItem)
            const logger = setupMockLogger()

            const foundItem = await cache.lookup(cachedItem.key, collection, logger)
            db.close()

            return expect(foundItem.val).to.equal(cachedItem.val)
        })
        it('updates the value if TTL has been reached', async () => {
            const db = await MongoClient.connect(config.mongoConnectionUrl)
            const collection = db.collection(config.mongo.collection)
            const cachedItem = {
                key: uuid.v4(),
                val: 'I\'m up on the eleventh floor and I\'m watching the cruisers below',
                ttl: moment().subtract(1, 'seconds').toDate()
            }
            await collection.insertOne(cachedItem)
            const logger = setupMockLogger()

            const foundItem = await cache.lookup(cachedItem.key, collection, logger)
            db.close()

            return expect(foundItem.val).not.to.equal(cachedItem.val)
        })



    })
    it('deletes older entries if maximum amount of entries has been reached', async ()=> {
        const db = await MongoClient.connect(config.mongoConnectionUrl)
        const collection = db.collection(config.mongo.collection)
        const cachedItems = []
        for (let i = 0; i < config.ttl.maxItems; i++) {
            cachedItems.push({
                key: uuid.v4(),
                val: 'I\'m up on the eleventh floor and I\'m watching the cruisers below '+i,
                ttl: moment().subtract(1, 'seconds').toDate()
            })
        }
        await collection.insertMany(cachedItems)
        const oldestEntry = {
            key: uuid.v4(),
            val: 'Day after day, they take my friends away to mansions cold and grey, to the far side of town',
            ttl: moment().subtract(10, 'days').toDate()
        }
        await collection.insertOne(oldestEntry)

        const logger = setupMockLogger()

        const foundItem = await cache.lookup(cachedItems[config.ttl.maxItems - 1 ].key, collection, logger)
        const foundAmount = await collection.count()
        db.close()

        expect(foundAmount).to.equal(config.ttl.maxItems)
        expect(foundItem.val).not.to.equal(cachedItems[config.ttl.maxItems - 1 ].val)
        return
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
