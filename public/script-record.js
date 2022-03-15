

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

var myId
const myVideo = createVideoElement()
myVideo.muted = true

const peers = {}
const streamProps = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then((stream) => {
  console.log('myStream: ', stream)
  
  addVideoStream(myVideo, stream, {local: true}, '111111111 async') 
  
//   logit2('CHECK HERE: w='+stream.width+'  h='+stream.height)
  
  console.log('myPeer: ', myPeer)

  /***
  someone is calling ME...
  How does this get called?
  myPeer.on('open', id => {}) emits socket:join-room
  server.js socket:on:join-room listens for "ready" event
  below: socket.emit("ready")  causes server.js to broadcast : user-connected
  below: !! in other peers !!  socket.on:user-connected calls connectToNewUser() 
  connectToNewUser() !! in other peers !! calls  myPeer.call(remoteUserId, ourStream)
  
  THE 2ND PERSON TO JOIN HAS THIS EXECUTED - THE FIRST PERSON TO JOIN DOES NOT
     compare this with  connectToNewUser() below
  ***/
  myPeer.on('call', call => {    
    const video = createVideoElement()
    
    stream.name = 'brentstream'
    logit2('myPeer.on(call): stream.id='+stream.id)
    logit2('myPeer.on(call): stream.width='+stream.width)
    logit2('myPeer.on(call): stream.name='+stream.name)
    call.answer(stream, {mymeta: {foo: 'bar'}})   //  ... so I answer  Where does this stream go?
    logit('call.answer():  ok')
    
    call.on('stream', userVideoStream => {
      /**
      YOU ONLY GET THIS WHEN YOU REFRESH FROM PC, NOT FROM IPHONE
      **/
      logit('myPeer.on(call, call => {})  STREAM EVENT - THIS IS WHAT WE WANT TO SEE')
      addVideoStream(video, userVideoStream, {local: false}, '2222222')
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
  
//   socket.on('dimensions-broadcast', args => {
//       const strm = streamProps[args.streamId]
//       strm.width = args.width
//       strm.height = args.height
//   })
  
  initRecordButton()
  initStopButton()
  
  socket.emit("ready", ROOM_ID, myId)  //  https://stackoverflow.com/questions/66937384/peer-oncalll-is-never-being-called
  
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
  myId = id
  logit('myPeer.on("open", id)  id = '+id)
  //   console.log('myPeer.on("open", id)  id = '+id)
  socket.emit('join-room', ROOM_ID, id)
})

// when a remote user connects
// How does this get called?  It gets called from  socket.on('user-connected'...)  in this file
// 
// THE FIRST PERSON TO JOIN HAS THIS CALLED ON HIS MACHINE - THE 2ND PERSON TO JOIN DOESN'T SEE THIS GET CALLED ON HIS MACHINE
//   compare this with myPeer.on('call'...)  above
function connectToNewUser(remoteUserId, ourStream) {
  const call = myPeer.call(remoteUserId, ourStream)
  console.log('METADATA:  call = ', call)
  const video = createVideoElement()
  call.on('stream', userVideoStream => {
    logit2('connectToNewUser: STREAM NEW REMOTE USER')
    console.log('connectToNewUser: userVideoStream = ', userVideoStream)
    logit2('connectToNewUser: userVideoStream.id='+userVideoStream.id)
    logit2('connectToNewUser: userVideoStream.name='+userVideoStream.name)
    logit2('connectToNewUser: userVideoStream w='+userVideoStream.width+'  h='+userVideoStream.height) // UNDEFINED - WHY ?????????
    addVideoStream(video, userVideoStream, {local: false}, '3333333')
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
            type: 'video'
            , mimeType: 'video/webm'
//             , previewStream: function(s) {
//                 video.muted = true;
//                 video.srcObject = s;
//             }
        });
      
      
        recorder.startRecording()  //  RecordRTC:51
        
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
//             const vid = document.querySelector("video")            
            const vid = createVideoElement()   
            vid.src = url;
            const container = document.getElementById('video-playback')
            container.append(vid)
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

/**
if  evn.local = true   then we need to socket emit
**/
function addVideoStream(video, stream, env, dbg) {
    video.srcObject = stream
  
    video.addEventListener('loadedmetadata', () => {
        //  video.videoWidth and video.videoHeight are only only available here and not before
        video.play()
      
        var w = video.videoWidth
        var h = video.videoHeight
        logit2('addVideoStream: before '+dbg+'  window.orientation='+window.orientation)
        logit2('addVideoStream: before '+dbg+'  stream.width='+w+'  stream.height='+h)   //  addVideoStream: before 3333333 stream.width=320 stream.height=240
      
        if(window.orientation == 0/*portrait*/ && (h < w)) {
            // then flip the dims
            h = video.videoWidth
            w = video.videoHeight
        }
      
        if(!streamProps[stream.id]) {
            stream.width = w
            stream.height = h
            streamProps[stream.id] = stream // streamProps should be name-changed to something else.  It doesn't hold props
            logit2('addVideoStream: after '+dbg+'  stream.width='+w+'  stream.height='+h) 
            streams.push(stream)
        }

        if(videoGrid) videoGrid.append(video)
        else console.log('REMEMBER =========== video-grid tag was renamed to video-gridx so it wont show up/interfere')
    })

}








