const express = require('express')
const router = express.Router()
const Project = require('../models/project')
const User = require("../models/user")
const logger = require('../utils/logger')

router.get("/getProjects", async(req, res)=>{
    logger.info("[GALLERY] Fetching all projects")
    try
    {   
        const projects = await Project.find({}).sort({ createdAt: -1 })
        logger.info(`[GALLERY] Found ${projects.length} projects`)
        res.send(projects)
    }catch(error){
        logger.error("[GALLERY] Error fetching projects: ", error)
        res.status(500).send("Internal Server Error")
    }
})

router.get("/getAllUsers", async(req, res)=>{
    logger.info("[GALLERY] Fetching all verified users")
    try
    {   
        const users = await User.find({"UserInfo.email_verified" : Boolean(true)}).sort({ createdAt: -1 })
        logger.info(`[GALLERY] Found ${users.length} verified users`)
        res.send(users)
    }catch(error){
        logger.error("[GALLERY] Error fetching users: ", error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/getProjectById", async(req, res)=>{
    const projectID = req.body.projectID
    logger.info(`[GALLERY] Fetching project by ID: ${projectID}`)
    try
    {   
        const project = await Project.findOne({ProjectID : projectID})
        if (project) {
            logger.info(`[GALLERY] Project found: ${project.Title}`)
        } else {
            logger.warn(`[GALLERY] Project not found: ${projectID}`)
        }
        res.send(project)
    }catch(error){
        logger.error(`[GALLERY] Error fetching project ${projectID}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

module.exports = router