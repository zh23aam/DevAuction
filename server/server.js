const express = require('express')
const cors = require('cors')
const {createServer} = require('http')
const {Server} = require('socket.io')
const logger = require('./src/utils/logger')
const loggerMiddleware = require('./src/middlewares/loggerMiddleware')
const ConnectDB = require('./src/db/connection')
const {PORT} = require('./constants')

const cleanupJob = require('./src/utils/cleanupcode')
const contactRouter = require('./src/routes/contactusRoutes')
const auth = require('./src/middlewares/auth')
const dashboardRouter = require("./src/routes/dashboard")
const razorpayRouter = require('./src/routes/razorpay')
const createRoomRouter = require('./src/routes/createRouter')
const insideRoomRouter = require('./src/routes/insideRoomRouter')
const projectRouter = require('./src/routes/projectsRouter')
const profileRouter = require("./src/routes/profileRouter")
const liveStreamRouter = require("./src/routes/livestream")
const galleryRouter = require("./src/routes/gallery")

//mongodb connection
ConnectDB()

// middlewares
const app = express()
app.use(express.json())

// Enhanced request and response logging
app.use(loggerMiddleware);

// cors
app.use(cors({origin : true}))

// socket.io server
const server = createServer(app)
const io = new Server(server, {
    cors : {
        origin : true
    }
})

//mapping
const emailToSocketIdMap = new Map()

// socket.io connections
io.on("connection",(socket)=>{
    logger.info(`User connected: ${socket.id}`)

    socket.on("user:connected",async (data)=>{
        if(data.email){
            emailToSocketIdMap.set(data.email, socket.id)
            logger.info(`New map inserted for email: ${data.email}`)
        }
    })

    socket.on("user:message", async(data)=>{
        if(data.to){
            let reciverSocketID = emailToSocketIdMap.get(data.to)
            logger.info(`Message from ${data.from} to ${data.to}: ${data.message}`)
            logger.info(`Receiver socket.id: ${reciverSocketID}`)
            io.to(reciverSocketID).emit("user:message",{mes : data.message, at : Date.now()})
        }
    })

    socket.on("new:user",data=>{
        logger.info(`New user joined room ${data.roomID}: ${socket.id}`)
        io.to(data.roomID).emit("new:user",{message : "New user joined", id : socket.id})
    })

    socket.on("room:join",data => {
        logger.info(`User ${socket.id} joining room: ${JSON.stringify(data)}`)
        io.to(socket.id).emit("room:join",data)
    })

    socket.on("room:connect",data=>{
        logger.info(`User ${socket.id} connected to room ${data.roomID}`)
        socket.join(data.roomID)
        io.to(data.roomID).emit("room:connect",{message : "room joined successfully"})
    })

    socket.on("room:message",data => {
        logger.info(`Room message in ${data.roomID} from ${socket.id}`)
        io.to(data.roomID).emit("room:message",{message : data.message, sender : socket.id})
    })

    socket.on("on:bid",data=>{
        logger.info(`Bid placed in room ${data.roomID}: ${JSON.stringify(data)}`)
        io.to(data.roomID).emit("on:bid",{data})
    })

    socket.on("roomClose",data=>{
        io.to(data.roomID).emit("roomClose",{status : true})
    })

    socket.on("disconnect", async()=>{
        
        for (const [key, value] of emailToSocketIdMap.entries()) {
            if (value === socket.id) {
                emailToSocketIdMap.delete(key)
            }
        }
        logger.info(`User disconnected: ${socket.id}. Map entry deleted.`)  
    })
})

server.listen(PORT, ()=>{
    logger.info(`Server started successfully on port ${PORT}`)
    logger.info(`http://localhost:${PORT}`)
})

app.get("/",(req, res)=>{
    res.send("Welocome to DevAuction Server")
})

//routes
app.use("/auth",auth)
app.use("/contactus", contactRouter)
app.use("/dashboard",dashboardRouter)
app.use("/payments",razorpayRouter)
app.use("/create",createRoomRouter)
app.use("/rooms",insideRoomRouter)
app.use("/project",projectRouter)
app.use("/profile",profileRouter)
app.use("/livestream",liveStreamRouter)
app.use("/gallery", galleryRouter)

// to start chat cleanup process every midnight
// cleanupJob.start()
