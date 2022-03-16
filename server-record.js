const express = require('express')
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