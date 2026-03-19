const express = require('express')
const router = express.Router()
const Project = require('../models/project')
const User = require("../models/user")
const logger = require('../utils/logger')

router.post('/getProject', async (req,res)=>{
    // Logic to get data of specific project 
})

router.post('/offers', async (req, res) => {
    const { projectID, email } = req.body
    const offer = Number(req.body.offer)
    logger.info(`[PROJECT-OFFERS] Placing offer: project=${projectID}, user=${email}, amount=${offer}`)
  
    try {
        const project = await Project.findOne({ ProjectID: projectID })

        if (!project) {
            logger.warn(`[PROJECT-OFFERS] Project not found: ${projectID}`)
            return res.status(404).send('Project not found')
        }

        if(offer >= project.OfferPrice){
            project.Offers.push({
                email : email,
                amount : offer,
                results : 0
            }) 
            await project.save()
            logger.info(`[PROJECT-OFFERS] Offer saved to project: ${projectID}`)

            // logic to add data inside user spendings
            const user = await User.findOneAndUpdate({"UserInfo.email" : email},{
                $inc : {"Profile.Credits" : -offer*100},
                $push : {"Profile.Spendings" : {Category : "Offer", Amount : offer}}
            })

            if(!user)
            {
                logger.error(`[PROJECT-OFFERS] User not found for credit update: ${email}`)
                return res.status(404).json({message : "User Not found"})
            }

            await user.save()
            logger.info(`[PROJECT-OFFERS] User credits updated: ${email}`)
        
            res.status(201).send('Offer placed successfully')
        }
        else{
            logger.warn(`[PROJECT-OFFERS] Offer amount too low: ${offer} < ${project.OfferPrice}`)
            res.status(400).send("Amount should be greater than offer price")
        }

    } catch (error) {
        logger.error(`[PROJECT-OFFERS] Error placing offer on project ${projectID}: `, error)
        res.status(500).send('Internal Server Error')
    }
})

router.post("/earnings", async (req,res)=>{
    const {email, category, amount} = req.body

    try {
        const user = await User.findOne({"UserInfo.email" : email},{
            $inc : {"Profile.Credits" : amount},
            $push : {"Profile.Earnings" : {Category : category, Amount : amount}}
        })

        if(!user){
            res.status(500).json({message : "User Not found"})
        }

        await user.save()
        res.status(201).send("earnings updated successfully")
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error')
    }
})


module.exports = router
