const express = require('express')
const fs = require('fs')
const {google} = require('googleapis')
const multer = require('multer')
const path = require('path')
const {
    GOOGLE_REFRESH_TOKEN
} = require('../../constants')
const Room = require('../models/createRoom')
const crypto = require('crypto')
const Project = require('../models/project')
const User = require("../models/user")
const Auction = require('../models/Auction')
const logger = require('../utils/logger')
const livekitService = require('../services/livekitService')

const router = express.Router()

const SCOPE = ['https://www.googleapis.com/auth/drive']

async function authorize() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        logger.error('[GOOGLE-DRIVE] Missing OAuth2 credentials (Client ID, Secret, or Refresh Token)');
        throw new Error('OAuth2 credentials not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // Default redirect URI for playground or your app's redirect URI
    );

    oauth2Client.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN
    });

    return oauth2Client;
}


async function uploadFile(authClient, filename) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const filepath = `./public/temp/${filename}`;

    if (!fs.existsSync(filepath)) {
        logger.error(`[GOOGLE-DRIVE] File not found on local disk: ${filepath}`);
        throw new Error(`Local file not found: ${filepath}`);
    }

    const createWithFolder = async (folderId) => {
        const requestBody = {
            name: filename,
            mimeType: 'application/zip'
        };
        if (folderId) {
            requestBody.parents = [folderId];
        }

        logger.info(`[GOOGLE-DRIVE] Creating file on Drive. Parent: ${folderId || 'root'}`);
        return drive.files.create({
            requestBody: requestBody,
            media: {
                body: fs.createReadStream(filepath),
                mimeType: 'application/zip'
            },
            fields: 'id'
        });
    };

    try {
        const targetFolder = GOOGLE_DRIVE_FOLDER_ID || '1fnkhuzv-8GbO88pL4sPYieJ9Ciaw096l';
        const response = await createWithFolder(targetFolder);
        logger.info(`[GOOGLE-DRIVE] Upload successful. File ID: ${response.data.id}`);
        return response;
    } catch (error) {
        const errorMsg = error.message || (error.response && error.response.data && error.response.data.error && error.response.data.error.message) || "";
        logger.error(`[GOOGLE-DRIVE] Primary upload attempt failed: ${errorMsg}`, { status: error.status, data: error.response?.data });

        if (errorMsg.includes('File not found') || error.status === 404) {
            logger.warn(`[GOOGLE-DRIVE] Target folder invalid or inaccessible. Retrying upload to root.`);
            try {
                const response = await createWithFolder(null);
                logger.info(`[GOOGLE-DRIVE] Fallback upload successful. File ID: ${response.data.id}`);
                return response;
            } catch (retryError) {
                const retryErrorMsg = retryError.message || (retryError.response && retryError.response.data && retryError.response.data.error && retryError.response.data.error.message) || "";
                logger.error(`[GOOGLE-DRIVE] Fallback upload failed: ${retryErrorMsg}`);
                throw retryError;
            }
        }
        throw error;
    }
}

async function downloadFile(fileId) {
    const authClient = await authorize();
    const drive = google.drive({ version: 'v3', auth: authClient });
  
    try {
        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
        const dest = fs.createWriteStream(`./public/downloads/sourcecode.zip`)
    
        response.data
            .on('end', () => {
            logger.info('File downloaded successfully!')
            })
            .on('error', (err) => {
            logger.error('Error downloading file:', err)
            })
            .pipe(dest);
    } catch (err) {
        logger.error('Error downloading file:', err)
    }
}

const storage = multer.diskStorage({
    destination : function(req,file,cb){
        return cb(null, "./public/temp")
    },
    filename : function (req, file, cb){
        return cb(null,`${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({storage})

function generateUniqueHexId() {
    const randomBytes = crypto.randomBytes(20);
    const hexString = randomBytes.toString('hex')
    return hexString.slice(0, 15)
}

router.post('/project', upload.single("file"), async (req,res)=>{
    const email = req.body.email
    const title = req.body.title
    logger.info(`[CREATE-PROJECT] Attempting to create project: ${title} by ${email}`)

    try{
        const currentFilename = req.file.filename
        const cleanup = () => {
            const tempPath = path.join(__dirname, '../../public/temp', currentFilename);
            fs.unlink(tempPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    logger.error(`[CREATE-PROJECT] Error deleting temp file ${currentFilename}: `, err)
                }
            })
        }
        
        let fileuploadResponse;
        try {
            fileuploadResponse = await authorize().then(auth => uploadFile(auth, currentFilename))
        } catch (err) {
            logger.error(`[CREATE-PROJECT] Google Drive upload error for ${title}: `, err)
            cleanup()
            throw err
        }
        const project_id = generateUniqueHexId()
        let parsedTags = []
        try {
            const rawTags = req.body.tags || req.body.skills
            if (rawTags) {
                parsedTags = typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags
            }
        } catch (e) {
            logger.warn(`[CREATE-PROJECT] Error parsing tags: ${e.message}`)
            parsedTags = []
        }

        const Owner = email
        const Image = req.body.image
        const Title = title
        const Status = Boolean(false)
        const Description = req.body.description
        const Category = req.body.category
        const Tags = parsedTags
        const FileID = fileuploadResponse.data.id
        const Link = req.body.link
        const OfferPrice = Number(req.body.offerPrice)
        const ProjectID = project_id

        if (!Owner || !Title || !Description || !FileID || !OfferPrice || !ProjectID) {
            logger.warn(`[CREATE-PROJECT] Missing required fields for project: ${title}`)
            return res.status(400).json({ message: 'Please fill in all required fields' })
        }
        else{
            const newProject = new Project({Owner, Image, Title, Description, Status, Tags, Category, FileID, Link, ProjectID, OfferPrice, Offers : [], Sold : {}})
            await newProject.save()
            logger.info(`[CREATE-PROJECT] Project document saved: ${project_id}`)
            cleanup()

            const user = await User.findOneAndUpdate({"UserInfo.email" : email},{ 
                $push : {
                    "Profile.Projects" : project_id,
                }
            })

            if (user) {
                await user.save()
                logger.info(`[CREATE-PROJECT] User profile updated with project: ${project_id}`)
            } else {
                logger.error(`[CREATE-PROJECT] User not found during update: ${email}`)
            }

            res.send({ message : "Project created successfully"})
        }

        
    }catch(error)
    {
        logger.error(`[CREATE-PROJECT] Error creating project ${title}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/room", upload.single("file"), async (req,res)=>{
    const title = req.body.title
    try{
        let finalFileID = req.body.fileID;

        if (req.file) {
            const currentFilename = req.file.filename
            try {
                const fileuploadResponse = await authorize().then(auth => uploadFile(auth, currentFilename))
                finalFileID = fileuploadResponse.data.id
                
                // Cleanup temp file
                fs.unlink(`./public/temp/${currentFilename}`, (err) => {
                    if (err) logger.error(`[CREATE-ROOM] Error deleting temp file ${currentFilename}: `, err)
                    else logger.info('Temp file deleted successfully!')
                })
            } catch (uploadErr) {
                logger.error(`[CREATE-ROOM] Google Drive upload error: `, uploadErr)
                // Cleanup even on failure
                fs.unlink(`./public/temp/${currentFilename}`, () => {})
                return res.status(500).json({ message: 'File upload failed' })
            }
        }

        const room_id = generateUniqueHexId()

        const {Owner ,Image,Status,Time,Title,Description,FileID, RoomID} = {
            Owner : req.body.email,
            Image : req.body.image,
            Status: Boolean(false),
            Time: req.body.date,
            Title : title,
            Description: req.body.description,
            FileID : finalFileID,
            RoomID : room_id
        }

        if (!Owner || !Image || !Time || !Title || !Description || !FileID || !RoomID ) {
            logger.warn(`[CREATE-ROOM] Missing required fields for room: ${title}`)
            return res.status(400).json({ message: 'Please fill in all required fields' })
        }else{
            const newRoom = new Room({Owner ,Image,Time,Title,Status,Description,FileID, RoomID, Bids : [], Sold : {}})
            await newRoom.save()
            logger.info(`[CREATE-ROOM] Room created successfully: ${room_id}`)

            // Create corresponding LiveKit room for video conferencing
            try {
              await livekitService.createRoom(room_id, `auction-${room_id}`);
              logger.info(`[CREATE-ROOM] LiveKit room created: auction-${room_id}`);
            } catch (livekitErr) {
              logger.warn(`[CREATE-ROOM] LiveKit room creation failed (non-fatal): ${livekitErr.message}`);
              // Non-fatal: auction can still proceed, LiveKit room will be auto-created on first join
            }

            // Create Auction document for bidding/state management
            try {
              const hostUser = await User.findOne({ 'UserInfo.email': req.body.email });
              await Auction.create({
                roomId: room_id,
                hostId: hostUser?._id || new (require('mongoose').Types.ObjectId)(),
                title: Title,
                description: Description,
                startingBid: 0,
                currentHighestBid: 0,
                minimumIncrement: 1,
                originalDurationSeconds: 3600,
                remainingSeconds: 3600,
                status: 'pending',
                livekitRoomName: `auction-${room_id}`,
              });
              logger.info(`[CREATE-ROOM] Auction document created for room: ${room_id}`);
            } catch (auctionErr) {
              logger.error(`[CREATE-ROOM] Auction document creation failed: ${auctionErr.message}`, {
                stack: auctionErr.stack,
                roomId: room_id,
              });
            }

            const user = await User.findOneAndUpdate({"UserInfo.email" : req.body.email},{ 
                $push : {
                    "Profile.RoomsCreated" : room_id,
                }
            })
            if (user) await user.save()

            res.send({ RoomID : room_id})
        }
    }catch(error)
    {
        logger.error(`[CREATE-ROOM] Fatal error: `, error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
})

router.post("/download",async(req, res) => {
    const fileID = req.body.fileID 
    logger.info(`[DOWNLOAD] Attempting download for FileID: ${fileID}`)
    try{
        await downloadFile(fileID).catch(err => logger.error(`[DOWNLOAD] Error in downloadFile: `, err))

        res.redirect("https://devauction.onrender.com/create/sendfile")

    }catch(error){
        logger.error(`[DOWNLOAD] Unexpected error: `, error)
    }
})

router.get("/sendfile",async(req, res) => {  
    try{
        const folderPath = process.argv[1]
        const filepath = `${path.dirname(folderPath)}/public/downloads/sourcecode.zip`

        fs.access(filepath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).send('File not found')
            }
            
            res.sendFile(filepath, (err) => {
                if (err) {
                  logger.error('Error sending file:', err)
                  res.status(500).send('Error sending file')
                  return
                }
          
                fs.unlink("./public/downloads/sourcecode.zip", (err) => {
                    if (err) {
                        logger.error(err);
                    } else {
                        logger.info('File deleted successfully!');
                    }
                })
            })
        })

    }catch(error){
        logger.error(error)
    }
})

module.exports = router
