const express = require('express')
const router = express.Router()
const Room = require('../models/createRoom')
const User = require("../models/user")
const logger = require('../utils/logger')

router.post("/getRooms", async(req, res)=>{
    const type = req.body.type // free premium history
    logger.info(`[DASHBOARD] Fetching rooms for type: ${type}`)
    try
    {   
        let rooms;
        if(type == "free"){
            rooms = await Room.find({Status : Boolean(false)}).sort({ createdAt: -1 })
            logger.info(`[DASHBOARD] Found ${rooms.length} free rooms`)
            res.send({freeRooms : rooms})
        }
        else if(type == "history"){
            rooms = await Room.find({Status : Boolean(true)}).sort({ createdAt: -1 })
            logger.info(`[DASHBOARD] Found ${rooms.length} history rooms`)
            res.send({history : rooms})
        }
        else if(type == "all"){
            const free = await Room.find({Status : Boolean(false)}).sort({ createdAt: -1 })
            const history = await Room.find({Status : Boolean(true)}).sort({ createdAt: -1 })
            logger.info(`[DASHBOARD] Found ${free.length} free and ${history.length} history rooms`)
            res.send({freeRooms : free, history : history})
        }
        else{
            logger.warn(`[DASHBOARD] Invalid room type requested: ${type}`)
            res.send("Sending wrong type")
        }
        
    }catch(error){
        logger.error("[DASHBOARD] Error fetching rooms: ", error)
    }
})

router.get('/highestBidders', async (req, res) => {
    logger.info('[DASHBOARD] Fetching highest bidders')
    try{
        let data = []
        const highestBidders = await Room.find({"Sold.amount": { $exists: true } }).sort({ "Sold.amount": -1 }).limit(10)
        logger.info(`[DASHBOARD] Found ${highestBidders.length} highest bidders in rooms`)

        for(let i = 0;i < highestBidders.length; i++){
            const userEmail = highestBidders[i].Sold.email
            const user = await User.findOne({ "UserInfo.email" : userEmail})

            if (user) {
                data.push({
                    title : highestBidders[i].Title,
                    name : user.UserInfo.name,
                    amount : highestBidders[i].Sold.amount
                })
            }
        }
        logger.info(`[DASHBOARD] Successfully processed ${data.length} bidders`)
        res.send({data})
    }catch(error){
        logger.error("[DASHBOARD] Error fetching highest bidders: ", error)
    }
})

module.exports = router
