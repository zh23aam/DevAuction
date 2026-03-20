const express = require('express')
const router = express.Router()
const User = require("../models/user")
const Inbox = require('../models/inbox')
const Project = require("../models/project")
const logger = require('../utils/logger')

router.post('/', async (req, res) => {
    const email = req.body.email
    logger.info(`[PROFILE] Fetching profile for email: ${email}`)

    try{    
        const user = await User.findOne({"UserInfo.email" : email})
        if (user) {
            logger.info(`[PROFILE] User found: ${user.UserInfo.name}`)
        } else {
            logger.warn(`[PROFILE] User not found for email: ${email}`)
        }
        res.send({userData : user})

    } catch(error) {
        logger.error(`[PROFILE] Error fetching profile for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/getUsers', async (req, res) => {
    const name = req.body.name
    logger.info(`[PROFILE] Searching users by name: ${name}`)

    try{    
        const users = await User.find({"UserInfo.name" : name})
        logger.info(`[PROFILE] Found ${users.length} users with name: ${name}`)
        res.send({users : users})

    } catch(error) {
        logger.error(`[PROFILE] Error searching users by name ${name}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/getUsersById', async (req, res) => {
    const id = req.body.id

    try{    
        const user = await User.findById(id)
        res.send({userData : user})

    } catch(error) {
        console.error(error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/userProjects', async (req, res) => {
    const email = req.body.email
    logger.info(`[PROFILE] Fetching projects for user: ${email}`)

    try{
        let userProjects = []
        const user = await User.findOne({"UserInfo.email" : email})
        
        if (!user) {
            logger.warn(`[PROFILE] User not found for project fetch: ${email}`)
            return res.status(404).send("User not found")
        }

        const projectArray = user.Profile.Projects
        logger.info(`[PROFILE] User has ${projectArray.length} projects`)

        for(let i = 0; i < projectArray.length; i++){
            const project = await Project.findOne({ProjectID : projectArray[i]})
            if (project) userProjects.push(project)
        }

        logger.info(`[PROFILE] Successfully retrieved ${userProjects.length} projects`)
        res.send({userProjects})
        
    }catch(error){
        logger.error(`[PROFILE] Error fetching user projects for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/placeOffer', async (req, res) => {
    const { projectID, email, amount } = req.body
    logger.info(`[PROFILE-OFFER] Placing offer: project=${projectID}, user=${email}, amount=${amount}`)

    try{
        const project = await Project.findOneAndUpdate({ProjectID : projectID},{
            $push : {"Offers" : {
                email : email,
                amount : amount,
                results : 0
            }}
        })
        
        if (project) {
            await project.save()
            logger.info(`[PROFILE-OFFER] Offer placed successfully on project: ${projectID}`)
            res.send("Offer placed successfully")
        } else {
            logger.warn(`[PROFILE-OFFER] Project not found for offer: ${projectID}`)
            res.status(404).send("Project not found")
        }
    }catch(error){
        logger.error(`[PROFILE-OFFER] Error placing offer on ${projectID}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/getUserOffers', async (req, res) => {
    const email = req.body.email
    logger.info(`[PROFILE-USER-OFFERS] Fetching offers for user: ${email}`)
    let offers = []

    try{
        const projects = await Project.find({Owner : email})
        const length = projects.length
        logger.info(`[PROFILE-USER-OFFERS] User has ${length} projects`)

        for(let i = 0;  i < length; i++){
            const projectOffersLength = projects[i].Offers.length
            for(let j = 0; j < projectOffersLength; j++){
                const user = await User.findOne({"UserInfo.email" : projects[i].Offers[j].email})
                if (user) {
                    offers.push({
                        name : user.UserInfo.name,
                        projectTitle : projects[i].Title,
                        amount : projects[i].Offers[j].amount,
                        result : projects[i].Offers[j].results
                    })
                }
            }
        }

        logger.info(`[PROFILE-USER-OFFERS] Successfully retrieved ${offers.length} total offers`)
        res.send({offers})
    }catch(error){
        logger.error(`[PROFILE-USER-OFFERS] Error fetching offers for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/getProjectOffers', async (req, res) => {
    const projectID = req.body.projectID
    logger.info(`[PROFILE-PROJECT-OFFERS] Fetching offers for project: ${projectID}`)
    let offers = []

    try{
        const project = await Project.findOne({ProjectID : projectID})
        if (!project) {
            logger.warn(`[PROFILE-PROJECT-OFFERS] Project not found: ${projectID}`)
            return res.status(404).send("Project not found")
        }

        const length = project.Offers.length
        logger.info(`[PROFILE-PROJECT-OFFERS] Project has ${length} offers`)

        for(let i = 0;  i < length; i++){
            const user = await User.findOne({"UserInfo.email" : project.Offers[i].email})
            if (user) {
                offers.push({
                    name : user.UserInfo.name,
                    amount : project.Offers[i].amount,
                    result : project.Offers[i].results
                })
            }
        }

        logger.info(`[PROFILE-PROJECT-OFFERS] Successfully retrieved ${offers.length} valid offers`)
        res.send({offers})
    }catch(error){
        logger.error(`[PROFILE-PROJECT-OFFERS] Error fetching offers for project ${projectID}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/edit", async(req, res)=>{
    const { email, bio, skills } = req.body
    logger.info(`[PROFILE] Editing profile for: ${email}`)

    try{
        const user = await User.findOneAndUpdate({"UserInfo.email" : email},{
            $set : {"Profile.Bio" : bio, "Profile.Skills" : skills}
        }, { new: true })
        
        if (user) {
            await user.save()
            logger.info(`[PROFILE] Profile updated successfully for ${email}`)
            res.send("Profile edited successfully")
        } else {
            logger.warn(`[PROFILE] User not found for edit: ${email}`)
            res.status(404).send("User not found")
        }
    }catch(error){
        logger.error(`[PROFILE] Error editing profile for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/follow", async (req, res) => {
    const { from, to } = req.body
    logger.info(`[PROFILE-FOLLOW] User ${from} following ${to}`)

    try {
        const fromUser = await User.findOne({"UserInfo.email": from})
        const toUser = await User.findOne({"UserInfo.email": to})

        if (!fromUser || !toUser) {
            logger.warn(`[PROFILE-FOLLOW] One or both users not found: from=${from}, to=${to}`)
            return res.status(404).json({ message: "User Not found" })
        }
        else{
            fromUser.Profile.Following.push(to)
            toUser.Profile.Followers.push(from)

            await fromUser.save()
            await toUser.save()
            logger.info(`[PROFILE-FOLLOW] Successfully updated followers for ${from} and ${to}`)

            res.status(201).send("Followers/following updated successfully")
        }
    } catch (error) {
        logger.error(`[PROFILE-FOLLOW] Error during follow (${from} -> ${to}): `, error)
        res.status(500).send("Internal Server Error");
    }
})

router.post("/unFollow", async (req, res) => {
    const { from, to } = req.body
    logger.info(`[PROFILE-UNFOLLOW] User ${from} unfollowing ${to}`)
  
    try {
        const fromUser = await User.findOne({ "UserInfo.email": from })
        const toUser = await User.findOne({ "UserInfo.email": to })
    
        if (!fromUser || !toUser) {
            logger.warn(`[PROFILE-UNFOLLOW] One or both users not found: from=${from}, to=${to}`)
            return res.status(404).json({ message: "User Not found" })
        }
    
        const fromFollowingIndex = fromUser.Profile.Following.indexOf(to)
        const toFollowersIndex = toUser.Profile.Followers.indexOf(from)
    
        
        if (fromFollowingIndex === -1 || toFollowersIndex === -1) {
            logger.warn(`[PROFILE-UNFOLLOW] Users are not following each other: from=${from}, to=${to}`)
            return res.status(400).json({ message: "Users are not following each other" });
        }
        else{
            fromUser.Profile.Following.splice(fromFollowingIndex, 1)
            toUser.Profile.Followers.splice(toFollowersIndex, 1)
        
            await fromUser.save()
            await toUser.save()
            logger.info(`[PROFILE-UNFOLLOW] Successfully updated followers for ${from} and ${to}`)
        
            res.status(200).send("Unfollowed successfully")
        }

    } catch (error) {
        logger.error(`[PROFILE-UNFOLLOW] Error during unfollow (${from} -> ${to}): `, error)
        res.status(500).send("Internal Server Error");
    }
  });

router.post('/followers', async (req, res) => {
    const array = req.body.followers
    logger.info(`[PROFILE-FOLLOWERS] Fetching followers data for ${array.length} users`)
    let data = []

    try{
        for(let i = 0; i <  array.length;i++){
            const user = await User.findOne({"UserInfo.email" : array[i]})
            if (user) {
                const segregatedData = {
                    email : array[i],
                    name : user.UserInfo.name,
                    image : user.UserInfo.picture,
                }
                data.push(segregatedData)
            }
        }
        logger.info(`[PROFILE-FOLLOWERS] Successfully retrieved ${data.length} followers records`)
        res.send({data : data})
    }catch(error){
        logger.error("[PROFILE-FOLLOWERS] Error fetching followers data: ", error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/following', async (req, res) => {
    const array = req.body.following
    logger.info(`[PROFILE-FOLLOWING] Fetching following data for ${array.length} users`)
    let data = []

    try{
        for(let i = 0; i <  array.length;i++){
            const user = await User.findOne({"UserInfo.email" : array[i]})
            if (user) {
                const segregatedData = {
                    email : array[i],
                    name : user.UserInfo.name,
                    image : user.UserInfo.picture,
                }
                data.push(segregatedData)
            }
        }
        logger.info(`[PROFILE-FOLLOWING] Successfully retrieved ${data.length} following records`)
        res.send({data : data})
    }catch(error){
        logger.error("[PROFILE-FOLLOWING] Error fetching following data: ", error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/inbox', async (req, res) => {
    const email = req.body.email
    logger.info(`[PROFILE-INBOX] Fetching inbox for user: ${email}`)
    let inboxArray = []
    const uniqueEmails = new Set()

    try{
        const inbox = await Inbox.findOne({User : email})
        if (!inbox) {
            logger.warn(`[PROFILE-INBOX] Inbox not found for user: ${email}`)
            return res.status(404).send("Inbox not found")
        }

        if(inbox.Messages.length == 0 && inbox.Recived.length == 0){
            logger.info(`[PROFILE-INBOX] Inbox empty for ${email}`)
            res.send("inbox empty")
        }
        else{
            const lengthSent = inbox.Messages.length
            const lengthRecived = inbox.Recived.length
    
            for(let i = 0; i < lengthSent;i++){
                const to = inbox.Messages[i].to
                const lastMsg = inbox.Messages[i].data[inbox.Messages[i].data.length - 1];
                if(!uniqueEmails.has(to)) {
                    const user = await User.findOne({"UserInfo.email" : to})
                    if (user) {
                        const segregatedData = {
                            email : to,
                            name : user.UserInfo.name,
                            image : user.UserInfo.picture,
                            lastMessageAt: lastMsg?.at || 0,
                            lastMessage: lastMsg?.mes || ""
                        }
                        inboxArray.push(segregatedData)
                        uniqueEmails.add(to)
                    }
                } else {
                    const existing = inboxArray.find(item => item.email === to);
                    if (existing && lastMsg?.at > existing.lastMessageAt) {
                        existing.lastMessageAt = lastMsg.at;
                        existing.lastMessage = lastMsg.mes;
                    }
                }
            }
    
            for(let i = 0; i < lengthRecived;i++){
                const from = inbox.Recived[i].from
                const lastMsg = inbox.Recived[i].data[inbox.Recived[i].data.length - 1];
                if(!uniqueEmails.has(from)) {
                    const user = await User.findOne({"UserInfo.email" : from})
                    if (user) {
                        const segregatedData = {
                            email : from,
                            name : user.UserInfo.name,
                            image : user.UserInfo.picture,
                            lastMessageAt: lastMsg?.at || 0,
                            lastMessage: lastMsg?.mes || ""
                        }
                        inboxArray.push(segregatedData)
                        uniqueEmails.add(from)
                    }
                } else {
                    const existing = inboxArray.find(item => item.email === from);
                    if (existing && lastMsg?.at > existing.lastMessageAt) {
                        existing.lastMessageAt = lastMsg.at;
                        existing.lastMessage = lastMsg.mes;
                    }
                }
            }
            
            logger.info(`[PROFILE-INBOX] Found ${inboxArray.length} unique conversations for ${email}`)
            res.send({data : inboxArray})
        }
    }catch(error){
        logger.error(`[PROFILE-INBOX] Error fetching inbox for ${email}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/chats', async (req, res) => {
    const { me, other } = req.body
    logger.info(`[PROFILE-CHATS] Fetching chats between ${me} and ${other}`)

    let meArray = []
    let otherArray = []

    try{
        const inbox = await Inbox.findOne({User : me})
        if (!inbox) {
            logger.warn(`[PROFILE-CHATS] Inbox not found for user: ${me}`)
            return res.send({myMessages: [], senderMessages: []})
        }

        const lengthSent = inbox.Messages.length
        const lengthRecived = inbox.Recived.length

        for(let i = 0; i < lengthSent;i++){
            if(inbox.Messages[i].to == other){
                meArray = inbox.Messages[i].data
                break
            }
        }

        for(let i = 0; i < lengthRecived;i++){
            if(inbox.Recived[i].from == other){
                otherArray = inbox.Recived[i].data
                break
            }
        }

        logger.info(`[PROFILE-CHATS] Retrieved ${meArray.length} sent and ${otherArray.length} received messages`)
        res.send({myMessages : meArray, senderMessages : otherArray})
 
    }catch(error){
        logger.error(`[PROFILE-CHATS] Error fetching chats between ${me} and ${other}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post('/chat/send', async (req, res) => {
    const { from, to, message } = req.body
    logger.info(`[PROFILE-CHAT-SEND] Sending message from ${from} to ${to}`)

    try{
        const userFrom = await Inbox.findOne({User : from})
        if (!userFrom) {
            logger.error(`[PROFILE-CHAT-SEND] Sender inbox not found: ${from}`)
            return res.status(404).send("Sender inbox not found")
        }

        const fromMessagesLength = userFrom.Messages.length
        
        let i = 0
        for(i = 0; i < fromMessagesLength;i++) {
            if(userFrom.Messages[i].to == to) {
                userFrom.Messages[i].data.push({
                    mes : message,
                    at : Date.now()
                })
                break
            }
        }

        if(i == fromMessagesLength) {
            userFrom.Messages.push({
                to : to,
                data : [{
                    mes : message,
                    at : Date.now()
                }]
            })
        }

        await userFrom.save()
        logger.info(`[PROFILE-CHAT-SEND] Message saved in sender (${from}) inbox`)

        const userTo = await Inbox.findOne({User : to})
        if (!userTo) {
            logger.error(`[PROFILE-CHAT-SEND] Recipient inbox not found: ${to}`)
            return res.status(404).send("Recipient inbox not found")
        }

        const toRecivedLength = userTo.Recived.length
        
        i = 0
        for(i = 0; i < toRecivedLength;i++) {
            if(userTo.Recived[i].from == from) {
                userTo.Recived[i].data.push({
                    mes : message,
                    at : Date.now()
                })
                break
            }
        }

        if(i == toRecivedLength) {
            userTo.Recived.push({
                from : from,
                data : [{
                    mes : message,
                    at : Date.now()
                }]
            })
        }

        await userTo.save()
        logger.info(`[PROFILE-CHAT-SEND] Message saved in recipient (${to}) inbox`)

        res.send("Message send successfully!")
        
    }catch(error){
        logger.error(`[PROFILE-CHAT-SEND] Error sending message (${from} -> ${to}): `, error)
        res.status(500).send("Internal Server Error")
    }
})

module.exports = router


