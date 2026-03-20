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

        if (offer <= 0) {
            return res.status(400).send("Amount should be greater than 0")
        }

        if (project.Owner === email) {
            logger.warn(`[PROJECT-OFFERS] Self-bidding attempt: user=${email}, project=${projectID}`)
            return res.status(400).send("You cannot place an offer on your own project")
        }

        if (offer < project.OfferPrice) {
            logger.warn(`[PROJECT-OFFERS] Offer too low: ${offer} < ${project.OfferPrice}`)
            return res.status(400).send(`Offer must be at least ₹${project.OfferPrice}`)
        }

        const user = await User.findOne({ "UserInfo.email": email })
        if (!user) {
            logger.error(`[PROJECT-OFFERS] User not found: ${email}`)
            return res.status(404).json({ message: "User Not found" })
        }

        const requiredCredits = offer * 100
        if ((user.Profile?.Credits || 0) < requiredCredits) {
            logger.warn(`[PROJECT-OFFERS] Insufficient credits: user=${email}, has=${user.Profile?.Credits}, needs=${requiredCredits}`)
            return res.status(400).send(`Insufficient balance! Your current balance is ${user.Profile?.Credits || 0} credits.`)
        }

        // Processing Offer
        project.Offers.push({
            email: email,
            amount: offer,
            results: 0
        })
        await project.save()

        // Deducting Credits
        user.Profile.Credits -= requiredCredits
        user.Profile.Spendings.push({ Category: "Offer", Amount: offer })
        await user.save()

        logger.info(`[PROJECT-OFFERS] Offer successful: project=${projectID}, user=${email}`)
        res.status(201).send('Offer placed successfully')

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
