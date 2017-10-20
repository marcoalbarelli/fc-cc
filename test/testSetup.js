'use strict'

require('dotenv').config()
const expect = require('chai').expect
const MongoClient = require('mongodb').MongoClient

describe('Test suite',()=>{
    it('can be run',()=>{
        expect(true).to.be.true
    })
    it('can connect to a running Mongo instance', ()=>{
        const mongoConnectionUrl = `mongodb://${process.env.MONGO_DB_HOST}:${process.env.MONGO_DB_PORT}/${process.env.MONGO_DB_NAME}`;
        return MongoClient.connect(mongoConnectionUrl)
            .then((db)=>{
                expect(db).not.to.be.null
                return db.close();
            })
            .catch((e)=>{
                e.message = `MongoDB may need to be set-up, did you copy the .env.dist file to .env? Is mongo up and running and reachable? Original exception message: ${e.message}`
                throw e
            })
    })
})
