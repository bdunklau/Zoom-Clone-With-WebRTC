/**

'put', public_flag, fullpath, `s3://${bucket}/${folder}/${filename}`
blob:https://test.headsup.video/b6002615-c813-4403-bfd4-148c3401dca2

s3cmd put -P /root/Zoom-Clone-With-WebRTC/public/uploads/7c3d48977964bb8c26811f0ca130ffab s3://zoomclone/7c3d48977964bb8c26811f0ca130ffab.mp4


  
    async uploadFile(fullpath, filename, bucket, folder) {
        const public_flag = '-P'
        return await this.runS3Cmd( ['put', public_flag, fullpath, `s3://${bucket}/${folder}/${filename}` ] )
    }
    
        const bucket = 'dev-bucket'
        const compSid = 'CJ2c0f54ed14102d67b558767227ce6790'
        const filename = 'thumb.jpg'
        
        
    From VideoBModel:
        let videoType = "video/mp4"
        let videoUrl =  `https://ewr1.vultrobjects.com/${bucket}/${compRecord.composition_sid}/video.mp4`
        
        
===============================================================================================================================
Sample output from node:   Notice that we may be able to give some progress indication to the user by looking for [part x of y] in the output

[StorageModel.runS3Cmd]  s3cmd put -P /root/Zoom-Clone-With-WebRTC/public/uploads/9880d0b1fc2242e51d89d86549cb9786 s3://zoomclone/tempfolder/340961cf-ef81-4412-b1a3-b2b4d55116c2.mp4
[StorageModel.runS3Cmd]  [STDOUT] upload: '/root/Zoom-Clone-With-WebRTC/public/uploads/9880d0b1fc2242e51d89d86549cb9786' -> 's3://zoomclone/tempfolder/340961cf-ef81-4412-b1a3-b2b4d55116c2.mp4'  [part 1 of 3, 15MB] [1 of 1]

    65536 of 15728640     0% in    0s   751.95 KB/s
 15728640 of 15728640   100% in    0s    21.02 MB/s  done

[StorageModel.runS3Cmd]  [STDOUT] upload: '/root/Zoom-Clone-With-WebRTC/public/uploads/9880d0b1fc2242e51d89d86549cb9786' -> 's3://zoomclone/tempfolder/340961cf-ef81-4412-b1a3-b2b4d55116c2.mp4'  [part 2 of 3, 15MB] [1 of 1]

    65536 of 15728640     0% in    0s   757.49 KB/s
 15728640 of 15728640   100% in    0s    30.48 MB/s  done

[StorageModel.runS3Cmd]  [STDOUT] upload: '/root/Zoom-Clone-With-WebRTC/public/uploads/9880d0b1fc2242e51d89d86549cb9786' -> 's3://zoomclone/tempfolder/340961cf-ef81-4412-b1a3-b2b4d55116c2.mp4'  [part 3 of 3, 8MB] [1 of 1]

   65536 of 8680211     0% in    0s  1363.21 KB/s
 8680211 of 8680211   100% in    0s    27.97 MB/s  done

[StorageModel.runS3Cmd]  [STDOUT] Public URL of the object is: http://zoomclone.ewr1.vultrobjects.com/tempfolder/340961cf-ef81-4412-b1a3-b2b4d55116c2.mp4
        

**/


const child_process = require('child_process');
const fs = require('fs')  //  https://nodejs.dev/learn/the-nodejs-fs-module
const express = require('express')
const multer  = require('multer');  //  https://stackoverflow.com/questions/39677993/send-blob-data-to-node-using-fetch-multer-express
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const cors = require('cors')
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(cors({
    origin: '*'
}))
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

/**
This works - if you really want to preserve the file name.  Multer will make its own name though.  And the name it uses really doesn't
matter because we know what that file name AND we know the name of the file passed from the client
**/
//  https://stackoverflow.com/questions/39677993/send-blob-data-to-node-using-fetch-multer-express
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, __dirname + '/public/uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     }
// })
// const upload = multer({storage});

const upload = multer({ dest: __dirname + '/public/uploads/' });

var uploadIt = upload.single('upl');
app.post('/api/test', uploadIt, async (req, res) => {
    // the file has already been uploaded at this point
    // the upload happens in "uploadIt"
   
    console.log(req.body);
  
    /**
    Ex:
     {
        fieldname: 'upl',
        originalname: '8ecf6c13-4687-4c8b-b5a2-109b1a0653f1.mp4',
        encoding: '7bit',
        mimetype: 'video/x-matroska',
        destination: '/root/Zoom-Clone-With-WebRTC/public/uploads/',
        filename: '3b06ff953d4ff566db709f5dcd394ae4',
        path: '/root/Zoom-Clone-With-WebRTC/public/uploads/3b06ff953d4ff566db709f5dcd394ae4',
        size: 393993
     }
    **/
    console.log(req.file);
  
    // upload to vultr storage
    const url = await uploadFile(req.file.path, req.file.originalname, 'zoomclone', 'tempfolder')    
  
    // delete file after upload - use  req.file.filename
    await deleteFile(req.file.path)
    
    res.send({url: url+'#t=0.1'/*makes iphones display first frame*/, videoType: "video/mp4"})
})


/**
from  StorageModel.js
**/
async function uploadFile(fullpath, filename, bucket, folder) {
    const public_flag = '-P'
    await runS3Cmd( ['put', public_flag, fullpath, `s3://${bucket}/${folder}/${filename}` ] ) // assumes no error uploading
    return `https://ewr1.vultrobjects.com/${bucket}/${folder}/${filename}`
}

  
/**
from  StorageModel.js
**/
async function runS3Cmd(args) {
    const cmd = 's3cmd'
    return new Promise((resolve, reject) => {
        const spawn = child_process.spawn
        const theResult = []
        console.log(`[StorageModel.runS3Cmd]  ${cmd} ${args.join(' ')}`)
        var proc = spawn(cmd, args);

        proc.stdout.on('data', function(data) {
            console.log(`[StorageModel.runS3Cmd]  [STDOUT]`, ''+data);
            theResult.push(''+data)
        });

        proc.stderr.setEncoding("utf8")
        proc.stderr.on('data', function(data) {
            // THERE IS OUTPUT HERE BUT NOT SURE HOW IMPORTANT IT IS.  WE GET THIS OUTPUT EVEN WHEN THINGS ARE PROCESSING OK - WHICH IS WEIRD
            console.log(`[StorageModel.runS3Cmd]  [STDERR]`, ''+data);
            //reject(data)
        });

        proc.on('close', function() {
            //console.log('finished:  theResult = ', theResult);
            resolve(theResult)
        });          
    })            

}


async function deleteFile(path) {
    return new Promise((resolve, reject) => {
        fs.rmdir(path, {recursive:true}, function(err) {
            console.log('DELETING: ', path)
            if(err) reject(err)
            else resolve()
        })
    }) 
}


app.get('/:room', (req, res) => {
  res.render('record', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log('roomId=', roomId, '  userId=', userId)
    socket.join(roomId)
    socket.on('ready',(someRoomId, someUserId) => {
        if(roomId != someRoomId) return
        if(userId != someUserId) return
        console.log('join-room: ready: emit user-connected')
        socket.broadcast.to(roomId).emit('user-connected',userId);
    })
    
    socket.on('orientation-change', (roomId, orientation, streamId) => {
      console.log('server: orientationchange to: ', orientation)
      socket.to(roomId).broadcast.emit('orientation-change', orientation, streamId)
    })

//     socket.on('user-dimensions', (args) => {
//         if(roomId != args.roomId) return
//         if(userId != args.userId) return
//         socket.broadcast.to(roomId).emit('dimensions-broadcast', args);     
//        // socket.emit("user-dimensions", {roomId: ROOM_ID, userId: myId, streamId: stream.id, width: width, height: height})   
//     })
    
    // socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(9001)