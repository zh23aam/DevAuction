// import mongoose from "mongoose"
// import {MONGODB_URL, DB_NAME} from "../../constants.js"
const mongoose = require('mongoose')
const {MONGODB_URL,DB_NAME} = require('../../constants')
const logger = require('../utils/logger')


const ConnectDB = async ()=> {
    try{
        if (process.env.NODE_ENV !== 'production') {
            mongoose.set('debug', (collectionName, method, query, doc) => {
                logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
            });
        }
        const baseUrl = MONGODB_URL.endsWith('/') ? MONGODB_URL.slice(0, -1) : MONGODB_URL;
        const connectionInstance = await mongoose.connect(`${baseUrl}/${DB_NAME}`)
        logger.info(`MongoDB connection established! ${connectionInstance.connection.host}`)
    }catch(error){
        logger.error("Database connection error: ", error)
        process.exit(1)
    }
}

// export default ConnectDB
module.exports = ConnectDB