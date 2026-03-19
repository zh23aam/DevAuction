const express = require('express')
const router = express.Router()
const webrtc = require('wrtc')
const Room = require("../models/createRoom")
const logger = require('../utils/logger')

let senderStream;

async function handleTrackEvent(e, peer) {
    try {
        senderStream = e.streams[0]
        logger.info("[LIVESTREAM] Track event handled, sender stream set")
    }catch(error){
        logger.error("[LIVESTREAM] Error handling track event: ", error)
    }
}

router.post("/roomDetails",async (req, res)=>{
    const roomId = req.body.roomId
    logger.info(`[LIVESTREAM] Fetching room details: ${roomId}`)

    try{
        const room = await Room.findOne({RoomID : roomId})
        if (room) {
            logger.info(`[LIVESTREAM] Room found: ${roomId}`)
        } else {
            logger.warn(`[LIVESTREAM] Room not found: ${roomId}`)
        }
        res.send(room)
        
    }catch(error){
        logger.error(`[LIVESTREAM] Error fetching room details for ${roomId}: `, error)
        res.status(500).send("Internal Server Error")
    }
})

router.post("/broadcast",async (req,res)=>{
    logger.info("[LIVESTREAM] Starting broadcast")

    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                }
            ]
        });
        peer.ontrack = (e) => handleTrackEvent(e, peer)
        const desc = new webrtc.RTCSessionDescription(req.body.sdp)
        await peer.setRemoteDescription(desc)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        const payload = {
            sdp: peer.localDescription
        }
        
        logger.info("[LIVESTREAM] Broadcast initialized successfully")
        res.json(payload)
        
    } catch (err) {
        logger.error("[LIVESTREAM] Error in broadcast: ", err)
        res.status(500).json({ message: 'Server error tracking broadcast' })
    }
  
})

router.post("/consumer",async (req,res)=>{
    logger.info("[LIVESTREAM] Consumer connection request")

    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                }
            ]
        })
        const desc = new webrtc.RTCSessionDescription(req.body.sdp)
        await peer.setRemoteDescription(desc)
        
        if (senderStream) {
            logger.info("[LIVESTREAM] Adding tracks to consumer peer")
            senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream))
        } else {
            logger.warn("[LIVESTREAM] Consumer requested tracks but senderStream is not set")
        }

        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        const payload = {
            sdp: peer.localDescription
        }
    
        logger.info("[LIVESTREAM] Consumer handshake payload sent")
        res.json(payload)
        
    } catch (err) {
        logger.error("[LIVESTREAM] Error in consumer handshake: ", err)
        res.status(500).json({ message: 'Server error in consumer connection' })
    }
  
})

module.exports = router
