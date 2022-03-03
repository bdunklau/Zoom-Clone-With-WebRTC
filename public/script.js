

/***********************************************************************************************
See  https://headsup-video.atlassian.net/wiki/spaces/HEAD3/pages/423493652/DIY+Video+Chat
See  https://headsupvideo.atlassian.net/browse/HEAD3-10
***********************************************************************************************/

const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  secure: true,
  host: 'testpeer.headsup.video',
  port: '443'
})

const myVideo = createVideoElement()

myVideo.muted = true
// myVideo.style.width="20px"
// myVideo.style.height="20px"
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(async(stream) => {
  await addVideoStream(myVideo, stream, '111111111 async')  
  
  console.log('myPeer: ', myPeer)

  /***
  someone is calling ME...
  How does this get called?
  myPeer.on('open', id => {}) emits socket:join-room
  server.js socket:on:join-room listens for "ready" event
  below: socket.emit("ready")  causes server.js to broadcast : user-connected
  below: !! in other peers !!  socket.on:user-connected calls connectToNewUser() 
  connectToNewUser() !! in other peers !! calls  myPeer.call(remoteUserId, ourStream)
  ***/
  myPeer.on('call', call => {    
    const video = createVideoElement()
    
    call.answer(stream)   //  ... so I answer
    logit('call.answer():  ok')
    
    call.on('stream', userVideoStream => {
      /**
      YOU ONLY GET THIS WHEN YOU REFRESH FROM PC, NOT FROM IPHONE
      **/
      logit('myPeer.on(call, call => {})  STREAM EVENT - THIS IS WHAT WE WANT TO SEE')
      addVideoStream(video, userVideoStream, '2222222')
    })
  
    logit('myPeer.on(call, call => {}) : listening for "close"')
    call.on('close', () => {
      logit('myPeer.on(call, call => {}) : remove &lt;video&gt;')
      video.remove()
    })
    
    logit('myPeer.on(call, call => {}) : call.peer '+call.peer)
    const remoteUserId = call.peer
    peers[remoteUserId] = call
  })

  logit('Start listening for user-connected')
  socket.on('user-connected', userId => {
    logit('user-connected: remote userId = '+userId)
    connectToNewUser(userId, stream)
    //setTimeout(connectToNewUser,5000,userId,stream)
  })
  
  socket.emit("ready")  //  https://stackoverflow.com/questions/66937384/peer-oncalll-is-never-being-called
  
})
// .catch(error => {    
//   logit(`error: ${error}`)
// })

socket.on('user-disconnected', userId => {
  logit('user-disconnected: remote userId = '+userId)
  logit('user-disconnected: peers[userId] = '+peers[userId])
  if (peers[userId]) peers[userId].close() // WHY UNDEFINED !!!!!!!!!!
})

myPeer.on('open', id => {
  logit('myPeer.on("open", id)  id = '+id)
  //   console.log('myPeer.on("open", id)  id = '+id)
  socket.emit('join-room', ROOM_ID, id)
})

// when a remote user connects
/**
THIS IS WHAT DOESN'T GET CALLED WHEN IPHONE RELOADS - BUT PC'S OK
**/
function connectToNewUser(remoteUserId, ourStream) {
  const call = myPeer.call(remoteUserId, ourStream)
  console.log('connectToNewUser: ourStream = ', ourStream)
  console.log('connectToNewUser: myPeer.call(remoteUserId, ourStream) => call.peer => ', call.peer)
  logit('connectToNewUser: myPeer.call(remoteUserId, ourStream) where remoteUserId='+remoteUserId)
  logit('connectToNewUser: myPeer.call(remoteUserId, ourStream) => call.peer => '+ call.peer)
  
  const video = createVideoElement()
  call.on('stream', userVideoStream => {
    console.log('connectToNewUser: STREAM NEW REMOTE USER')
    logit('connectToNewUser: STREAM NEW REMOTE USER')
    addVideoStream(video, userVideoStream, '3333333')
  })
  
  logit('connectToNewUser: listening for "close"')
  call.on('close', () => {
    logit('connectToNewUser: remove &lt;video&gt;')
    video.remove()
  })

  peers[remoteUserId] = call
}

function createVideoElement() {
    const myVideo = document.createElement('video')
    myVideo.setAttribute("controls", "")
    myVideo.setAttribute("playsinline", "")
    myVideo.setAttribute("preload", "metadata")
    return myVideo
}

function logit(msg) {
  const logging = document.getElementById('logging')
  const stuff = document.createElement('div')
  stuff.innerHTML = msg
  logging.append(stuff)
}

async function addVideoStream(video, stream, dbg) {
    return new Promise((resolve, reject) => {
        //   console.log('addVideoStream: video: ', video)   // the <video> tag
        //   console.log('addVideoStream: stream: ', stream) // MediaStream object
        video.srcObject = stream
        video.addEventListener('loadedmetadata', () => {
          logit('addVideoStream  play '+dbg)
          video.play()
        })
        videoGrid.append(video)
        logit('addVideoStream  resolve() '+dbg)
        resolve()
    })
  
}