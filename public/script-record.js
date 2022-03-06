

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

var recorder = new MRecordRTC();

const myVideo = createVideoElement()
myVideo.muted = true

const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  console.log('myStream: ', stream)
  
  addVideoStream(myVideo, stream, '111111111 async')    
  
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
  
  initRecordButton()
  initStopButton()
  
  socket.emit("ready")  //  https://stackoverflow.com/questions/66937384/peer-oncalll-is-never-being-called
  
})
// .catch(error => {    
//   logit(`error: ${error}`)
// })

socket.on('user-disconnected', userId => {
  logit('user-disconnected: remote userId = '+userId)
  logit('user-disconnected: peers[userId] = '+peers[userId])
  if (peers[userId]) peers[userId].close() 
})

myPeer.on('open', id => {
  logit('myPeer.on("open", id)  id = '+id)
  //   console.log('myPeer.on("open", id)  id = '+id)
  socket.emit('join-room', ROOM_ID, id)
})

// when a remote user connects
function connectToNewUser(remoteUserId, ourStream) {
  const call = myPeer.call(remoteUserId, ourStream)
  console.log('connectToNewUser: ourStream = ', ourStream)
  console.log('connectToNewUser: myPeer.call(remoteUserId, ourStream) => call.peer => ', call.peer)
  logit('connectToNewUser: myPeer.call(remoteUserId, ourStream) where remoteUserId='+remoteUserId)
  logit('connectToNewUser: myPeer.call(remoteUserId, ourStream) => call.peer => '+ call.peer)
  
  const video = createVideoElement()
  call.on('stream', userVideoStream => {
    console.log('connectToNewUser: STREAM NEW REMOTE USER userVideoStream = ', userVideoStream)
    console.log('connectToNewUser: STREAM NEW REMOTE USER userVideoStream.getAudioTracks() = ', userVideoStream.getAudioTracks())
    console.log('connectToNewUser: STREAM NEW REMOTE USER userVideoStream.getVideoTracks() = ', userVideoStream.getVideoTracks())
    logit('connectToNewUser: STREAM NEW REMOTE USER')
    addVideoStream(video, userVideoStream, '3333333')
  })
  
  logit('connectToNewUser: listening for "close"')
  call.on('close', () => {
    logit('connectToNewUser: remove &lt;video&gt;')
    video.remove()
  })

  peers[remoteUserId] = call
  console.log('peers:  ', peers)
}

function createVideoElement() {
    const myVideo = document.createElement('video')
    myVideo.setAttribute("controls", "")
    myVideo.setAttribute("playsinline", "")
    myVideo.setAttribute("preload", "metadata")
    return myVideo
}

function hideVideoGrid() {
    const vgrid = document.getElementById('video-grid')
    if(!vgrid) return
    vgrid.style.display = 'none'
}

const chunks = []
var recorder
const streams = []
const video = document.querySelector('video')
function initRecordButton() {
    const recordBtn = document.getElementById('recordBtn')
    if(!recordBtn) return
    recordBtn.addEventListener('click', evt => {     
      

        recorder = RecordRTC(streams, {
            type: 'video',
            mimeType: 'video/webm',
            previewStream: function(s) {
                video.muted = true;
                video.srcObject = s;
            }
        });
      
      
        recorder.startRecording()
        /**
        close - check out ==>  https://github.com/guest271314/MediaFragmentRecorder/blob/getdisplaymedia-webaudio/MediaFragmentRecorder.html#L81
        **/
//         let combined = new MediaStream(tracks)
//         recorder = new MediaRecorder(combined)
      
//         recorder.onstop = e => {
//           console.log('recorder stopped')
//           const completeBlob = new Blob(chunks, { type: chunks[0].type });
//           hideVideoGrid()
//           const video = createVideoElement()
//           video.src = URL.createObjectURL(completeBlob);
//           document.getElementById('recording').append(video)
//         };
//         console.log('combined : ', combined)
//         console.log('recorder : ', recorder)
      
//         //  https://dev.to/sebastianstamm/screen-recording-in-10-lines-of-vanilla-js-3bo8
//         recorder.ondataavailable = e => chunks.push(e.data);
//         recorder.start();
    })
}

function initStopButton() {
    const stopBtn = document.getElementById('stopBtn')
    if(!stopBtn) return
    stopBtn.addEventListener('click', evt => {
        console.log('stop clicked')
        if(!recorder) return        
        recorder.stopRecording(function(url, type) {
            console.log('stop recording:  type=',type,'  url=',url)
            const vid = document.querySelector("video")
            vid.src = url;
        });
    })
}

function logit(msg) {
}

function logit2(msg) {
  const logging = document.getElementById('logging')
  const stuff = document.createElement('div')
  stuff.innerHTML = msg
  logging.append(stuff)
}

function addVideoStream(video, stream, dbg) {
    logit2('addVideoStream:  '+dbg)
    video.srcObject = stream
  
    video.addEventListener('loadedmetadata', () => {
        logit('addVideoStream  play '+dbg)
        video.play()
    })
    
    console.log('addVideoStream:  stream.getVideoTracks()[0].getSettings().height = ', stream.getVideoTracks()[0].getSettings().height)
    console.log('addVideoStream:  stream.getVideoTracks()[0].getSettings().width = ', stream.getVideoTracks()[0].getSettings().width)
    logit2('addVideoStream: height = '+ stream.getVideoTracks()[0].getSettings().height)
    logit2('addVideoStream: width = '+ stream.getVideoTracks()[0].getSettings().width)
    logit2('addVideoStream: window.orientation = '+ window.orientation)
    streams.push(stream)
  
    if(videoGrid) videoGrid.append(video)
    else console.log('REMEMBER =========== video-grid tag was renamed to video-gridx so it wont show up/interfere')
  
    logit('addVideoStream  resolve() '+dbg)  
}








