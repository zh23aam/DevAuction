const cron = require("node-cron")
const Inbox = require('../models/inbox')
const moment = require('moment')
const fs = require('fs')
const path = require('path')

const cleanupJob = cron.schedule('0 0 * * *', async () => { 
    const oneDayAgo = moment().subtract(1, 'day').startOf('day').valueOf()

    // 1. Database Cleanup
    try {
        const deletedCount = await Inbox.deleteMany({
            $or: [
                { "Messages.data.at": { $lt: oneDayAgo } },
                { "Recived.data.at": { $lt: oneDayAgo } }
            ]
        })
        console.log(`Deleted ${deletedCount} day-old messages during cleanup`)
    } catch (error) {
        console.error('Error deleting day-old messages:', error)
    }

    // 2. Temp File Cleanup (Orphaned files)
    try {
        const tempDirPath = path.join(__dirname, '../../public/temp');
        if (fs.existsSync(tempDirPath)) {
            const files = fs.readdirSync(tempDirPath);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            files.forEach(file => {
                const filePath = path.join(tempDirPath, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > oneHour) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted orphaned temp file: ${file}`);
                }
            });
        }
    } catch (err) {
        console.error('Error during temp file cleanup:', err);
    }
})

module.exports = cleanupJob