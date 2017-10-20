'use strict'

const express = require('express');
const router = express.Router();
const cache = require('../src/cache')
const MongoClient = require('mongodb').MongoClient
const config = require('../config')


router.get('/cache/key/:key', async (req, res, next) => {
    /**
     *  I normally set up a connection in a middleware that injects it in a
     *  req property. This time it was hanging ...
     *  Man I really don't love mongo that much
     */

    const db = await MongoClient.connect(config.mongoConnectionUrl)
    const collection = db.collection(config.mongo.collection)
    const match = await cache.lookup(req.params.key,collection, req.log)
    if(match){
        return res.status(200).send(match.val)
    }
});

router.get('/cache/allKeys', async (req, res, next) => {
    const db = await MongoClient.connect(config.mongoConnectionUrl)
    const collection = await db.collection(config.mongo.collection).find().toArray()
    return res.status(200).json(collection.map((e)=>{
        return e.key
    }))
})

router.put('/cache/allKeys/delete', async (req, res, next) => {
    const db = await MongoClient.connect(config.mongoConnectionUrl)
    const collection = await db.collection(config.mongo.collection).drop()
    return res.status(200).send(null)
})

router.put('/cache/keys/:key', async (req, res, next) => {
    if(!req.body.val) {
        return res.status(400).send(null)
    }

    const db = await MongoClient.connect(config.mongoConnectionUrl)
    const collection = await db.collection(config.mongo.collection)
    const match = await cache.update(req.params.key,collection, req.log, req.body)
    return res.status(201).send(match.val)
})

router.put('/cache/keys/:key/delete', async (req, res, next) => {

    const db = await MongoClient.connect(config.mongoConnectionUrl)
    const collection = await db.collection(config.mongo.collection)
    const match = await cache.remove(req.params.key,collection, req.log, req.body)
    if(match) {
        return res.status(200).send(null)
    }
    return res.status(404).send(null)
})



module.exports = router;
