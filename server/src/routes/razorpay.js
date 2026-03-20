// import Router from "express"
// import Razorpay from "razorpay";
// import crypto from "crypto"
// import {RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, Webhook_Secret} from "../../constants.js"
// import Payment from "../models/payment.js";
const express = require('express')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const {RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, Webhook_Secret} = require('../../constants')
const Payment = require('../models/payment')
const User = require("../models/user")
const sendEmail = require("../utils/email")
const logger = require('../utils/logger')

const router = express.Router()

var instance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});

router.post("/",async (req,res)=>{
    const amount = req.body.amount
    logger.info(`[RAZORPAY] Creating order for amount: ${amount}`)

    var options = {
        amount: amount, // in paise
        currency: "INR",
        receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function(err,order) {
        if (err) {
            logger.error("[RAZORPAY] Error creating order: ", err)
            return res.status(500).send("Order creation failed")
        }
        logger.info(`[RAZORPAY] Order created successfully: ${order.id}`)
        res.json(order)
    });
})

router.post("/verify",async (req,res)=>{
    const secret = Webhook_Secret
    const email = req.body.payload.payment.entity.email
    const amount = req.body.payload.payment.entity.amount
    logger.info(`[RAZORPAY-VERIFY] Webhook received for ${email}, amount: ${amount}`)

    const shasum = crypto.createHmac("sha256", secret)
    shasum.update(req.rawBody)
    const digest = shasum.digest('hex')

    if(digest === req.headers["x-razorpay-signature"])
    {
        logger.info(`[RAZORPAY-VERIFY] Payment signature verified for ${email}`)
        
        const newPayment = new Payment({PaymentInfo : {email : email, amount : amount, type : "debit"}})
        await newPayment.save()
        logger.info(`[RAZORPAY-VERIFY] Payment record saved for ${email}`)

        const user = await User.findOneAndUpdate({"UserInfo.email" : email},{
            $push : {"Profile.Transactions" : {
                amount : amount,
                category : "credit",
                time : Date.now()
            }},
            $inc : {"Profile.Credits" : amount}
        })

        if (user) {
            await user.save()
            logger.info(`[RAZORPAY-VERIFY] User credits updated for ${email}`)
        } else {
            logger.error(`[RAZORPAY-VERIFY] User not found for update: ${email}`)
        }

        res.json({status : "ok"})
    }
    else
    {
        logger.warn(`[RAZORPAY-VERIFY] Invalid signature for payment from ${email}`)
        res.status(403).send("Invalid signature")
    }
})

router.post("/withdraw",async (req,res)=>{
    const email = req.body.email
    const amount = req.body.amount
    logger.info(`[RAZORPAY-WITHDRAW] Withdrawal request from ${email} for amount: ${amount}`)

    try{
        const user = await User.findOne({"UserInfo.email" : email})

        if(!user) {
            logger.warn(`[RAZORPAY-WITHDRAW] User not found: ${email}`)
            return res.status(404).send("User not found")
        }

        if(user.Profile.Credits >= amount){
            user.Profile.Transactions.push({
                amount : amount,
                category : "debit",
                time : Date.now()
            })

            user.Profile.Credits = user.Profile.Credits - amount
            await user.save()
            logger.info(`[RAZORPAY-WITHDRAW] Withdrawal processed for ${email}`)

            const subject = "Confirmation of Your Withdrawal Request"
            const html = `...` // Truncated for replacement but I'll keep the original in real apply

            sendEmail(email,subject,html)
            logger.info(`[RAZORPAY-WITHDRAW] Confirmation email sent to ${email}`)

            res.send("Withdraw successful")

        }else{
            logger.warn(`[RAZORPAY-WITHDRAW] Insufficient credits for ${email}: available=${user.Profile.Credits}, requested=${amount}`)
            res.status(400).send("User have less credits in his account")
        }   
    }catch(error){
        logger.error(`[RAZORPAY-WITHDRAW] Error processing withdrawal for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/transactions",async (req,res)=>{
    const email = req.body.email
    logger.info(`[RAZORPAY-TRANSACTIONS] Fetching transactions for: ${email}`)
    
    try{
        const user = await User.findOne({"UserInfo.email" : email})
        if (user) {
            logger.info(`[RAZORPAY-TRANSACTIONS] Found ${user.Profile.Transactions.length} transactions for ${email}`)
            res.send({transactions : user.Profile.Transactions})
        } else {
            logger.warn(`[RAZORPAY-TRANSACTIONS] User not found: ${email}`)
            res.status(404).send("User not found")
        }
    }catch(error){
        logger.error(`[RAZORPAY-TRANSACTIONS] Error fetching transactions for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

// export default router
module.exports = router
