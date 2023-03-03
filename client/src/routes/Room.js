import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { useParams } from "react-router";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

// const Container = styled.div`
//     display: flex;
//     height: 100vh;
//     width: 90%;
//     margin: auto;
//     flex-wrap: wrap;
// `;

const StyledVideo = styled.video`
    height: 100%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, [props.peer]);

    return (
        // <div className="cardWrapper">
        <StyledVideo playsInline autoPlay ref={ref} />
        // </div>
    );
}

const toogleVideo = document.getElementById("stop-video")
// console.log(toogleVideo);
let userStream

// const videoConstraints = {
//     height: window.innerHeight / 2,
//     width: window.innerWidth / 2
// };

// ratios
let ratios = ['4:3', '16:9', '1:1', '1:2']
let margin = 10;
let width = ''
let height = ''
let aspect = 0
let ratio = ratioFun() // to perfomance call here

// split aspect ratio (format n:n)
function ratioFun() {
    // debugger
    var ratio = ratios[aspect].split(":");
    return ratio[1] / ratio[0];
}

function aspectFun(i) {
    // console.log("aspectFun");
    aspect = 0;
    ratio = ratioFun()
    resize();
}


function resizer(width) {
    const data = document.getElementsByClassName('Dish')
    let children = data[0]?.children
    for (let s = 0; s < children.length; s++) {
        // camera fron dish (div without class)
        let element = children[s];

        // custom margin
        element.style.margin = margin + "px"
        // calculate dimensions
        element.style.width = width + "px"
        element.style.height = (width * ratio) + "px"
        element.style.borderRadius = "20px"

        // to show the aspect ratio in demo (optional)
        element.setAttribute('data-aspect', ratios[aspect]);

    }
}

// calculate area of dish:
function areaFun(increment) {
    const data = document.getElementsByClassName('Dish')
    let children = data[0]?.children

    let i = 0;
    let w = 0;
    let h = increment * ratio + (margin * 2);
    while (i < (children.length)) {
        if ((w + increment) > width) {
            w = 0;
            h = h + (increment * ratio) + (margin * 2);
        }
        w = w + increment + (margin * 2);
        i++;
    }
    if (h > height || increment > width) return false;
    else return increment;

}

function resize() {

    // get dimensions of dish
    dimensions()

    // loop (i recommend you optimize this)
    let max = 0
    let i = 1
    while (i < 1000) {
        let area = areaFun(i);
        if (area === false) {
            max = i - 1;
            break;
        }
        i++;
    }

    // remove margins
    max = max - (margin * 2);

    // set dimensions to all cameras
    resizer(max);
}

// calculate dimensions
function dimensions() {
    const dish = document.getElementsByClassName('Dish')
    width = dish[0]?.offsetWidth - (margin * 2);
    height = dish[0]?.offsetHeight - (margin * 2);
}






const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const { roomID, name } = useParams()
    const senders = useRef([])
    const [permissionFlagMic, setPermissionFlagMic] = useState(false)
    const [permissionFlagVideo, setPermissionFlagVideo] = useState(false)
    const [streamData, setStreamData] = useState([])


    useEffect(() => {
        socketRef.current = io.connect("https://e315-202-47-118-188.in.ngrok.io/", {
            withCredentials: true,
        });

        let permissions = JSON.parse(localStorage.getItem("permission"))
        const constraints = {
            video: Boolean(permissions?.video) ? true : false,
            audio: Boolean(permissions?.mic) ? true : false
        }

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            userStream = stream
            setStreamData(stream)
            userVideo.current.srcObject = stream;
            let audio = stream?.getAudioTracks()
            let video = stream?.getVideoTracks()
            audio && audio[0]?.enabled ? setPermissionFlagMic(true) : setPermissionFlagMic(false)
            video && video[0]?.enabled ? setPermissionFlagVideo(true) : setPermissionFlagVideo(false)

            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                console.log(users, "Users");
                // const peers = [];
                users.forEach(userID => {
                    console.log("UserID ALL USERS", userID);
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    // console.log(peer, "Peer");

                    // It will add peer connection details if present
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    // senders.current.push(peer)
                    // peers.push({
                    //     peerID: userID,
                    //     peer,
                    // });
                    setPeers(peersRef.current)
                })
                // setPeers(peers);
            })

            // THis function if for existing User
            socketRef.current.on("user joined", payload => {
                console.log("UserJoined", payload);
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })
                // const peerObj = {
                //     peerID: payload.callerID,
                //     peer,
                // }
                console.log(peersRef.current);
                setPeers(peersRef.current)
                console.log(peers);
                // setPeers(users => [...users, peerObj]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                console.log("Returened Signal", payload, peersRef.current);
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("user left", id => {
                console.log("user Left");
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers)
            })
        }).catch(err => console.log(err))

        return () => {
            socketRef.current.on("disconnect")
        }

    }, []);


    function createPeer(userToSignal, callerID, stream) {
        // userToSignal = userID
        // callerID = socket.current.id
        // debugger
        // let streamobj = JSON.stringify(stream)
        // socketRef.current.emit("createPeer", { "userID": userToSignal, "callerId": callerID, "stream": streamobj });
        // socketRef.current.on("getPeer", peer => console.log(peer))
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    {
                        urls: "stun:relay.metered.ca:80",
                    },
                ]
            }
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        //incomingSignal = user B Signal
        //callerID = UserB Socket ID
        console.log("New Peer", "Peer");
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,

            config: {
                iceServers: [
                    {
                        urls: "stun:relay.metered.ca:80",
                    },
                    {
                        urls: "turn:relay.metered.ca:80",
                        username: "e960152f60da57ee88a776f0",
                        credential: "wde5zoe3ySEIirUb",
                    },
                    {
                        urls: "turn:relay.metered.ca:443",
                        username: "e960152f60da57ee88a776f0",
                        credential: "wde5zoe3ySEIirUb",
                    },
                    {
                        urls: "turn:relay.metered.ca:443?transport=tcp",
                        username: "e960152f60da57ee88a776f0",
                        credential: "wde5zoe3ySEIirUb",
                    },
                ],
            }
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    useEffect(() => {
        setInterval(() => {
            setPeers([...peersRef.current])
        }, 3000);
    }, [])

    useEffect(() => {
        aspectFun()
    }, [peers])


    const handleVideoStop = () => {
        // const videoTrack = userStream.getTracks().find(track => track.kind === "video")
        // console.log(videoTrack);
        // if (videoTrack.enabled) {
        //     videoTrack.enabled = false
        //     // document.getElementById("stop-video").innerHTML = "Start Video"
        // }
        // else {
        //     videoTrack.enabled = true
        //     // document.getElementById("stop-video").innerHTML = "Stop Video"
        // }
        // 

        // Check Wheather Permission is Granted OR Not
        // If Permission is Granted stream is present in userStream
        if (userVideo.current.srcObject) {
            // Get Video Stream from userStream
            let stream1 = userVideo.current.srcObject.getVideoTracks()
            let stream2 = userStream.getVideoTracks()
            // To Turn Camera On
            if (stream1[0]?.enabled) {
                stream1[0].enabled = false // To make camera stream to disable
                stream1[0].stop()  // To turn off camera session
                stream2[0].stop()  // To turn off camera session
                setPermissionFlagVideo(false)
            }
            // To Turn Camera OFF
            else {
                // Check Wheather Audio stream is present OR Not
                let userDataAudio = userVideo.current.srcObject.getAudioTracks()
                if (userDataAudio.length) {
                    // If audio stream is already present and active grant access of video and audio
                    if (userDataAudio[0].enabled) {

                        navigator.mediaDevices.getUserMedia({ audio: "true", video: "true" })
                            .then(stream => {
                                userStream = stream
                                userVideo.current.srcObject = stream;
                                setPermissionFlagVideo(true)
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagVideo(false)
                            })
                    }
                    // Else Grant access to only video
                    else {
                        navigator.mediaDevices.getUserMedia({ video: "true" })
                            .then(stream => {
                                userStream = stream
                                userVideo.current.srcObject = stream;
                                setPermissionFlagVideo(true)
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagVideo(false)
                            })
                    }
                }
                // Only Get video Stream permission if audio stream is not present
                else {
                    navigator.mediaDevices.getUserMedia({ video: "true" }).then(stream => {
                        userStream = stream
                        userVideo.current.srcObject = stream;
                        setPermissionFlagVideo(true)
                    }).catch(err => {
                        console.log(err);
                        setPermissionFlagVideo(false)
                    })
                }

            }
        }
        // Only get Video Stream
        else {
            navigator.mediaDevices.getUserMedia({ video: "true" }).then(stream => {
                userStream = stream
                userVideo.current.srcObject = stream;
                setPermissionFlagVideo(true)
            }).catch(err => {
                console.log(err);
                setPermissionFlagVideo(false)
            })
        }
        handleVideoChange(userStream)
    }
    const handleAudioStop = () => {
        if (userVideo.current.srcObject) {
            // Get Audio Stream from userStream
            let stream1 = userVideo.current.srcObject.getAudioTracks()
            let stream2 = userStream.getAudioTracks()
            // To Turn audio OFF
            if (stream1[0]?.enabled) {
                stream1[0].enabled = false // To make audio stream to disable
                stream1[0].stop()  // To turn off audio session
                stream2[0].stop()  // To turn off audio session
                setPermissionFlagMic(false)
            }
            // To Turn Audio ON
            else {
                // Check Wheather video stream is present OR Not
                let userDataVideo = userVideo.current.srcObject.getVideoTracks()
                if (userDataVideo.length) {
                    // If video stream is already present and active grant access of video and audio
                    if (userDataVideo[0].enabled) {
                        navigator.mediaDevices.getUserMedia({ audio: "true", video: "true" })
                            .then(stream => {
                                userStream = stream
                                userVideo.current.srcObject = stream;
                                console.log(userVideo.current.srcObject, "Stream");
                                setPermissionFlagMic(true)
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagMic(false)
                            })
                    }
                    // Else Grant access to only audio
                    else {
                        navigator.mediaDevices.getUserMedia({ audio: "true" })
                            .then(stream => {
                                userStream = stream
                                userVideo.current.srcObject = stream;
                                setPermissionFlagMic(true)
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagMic(false)
                            })
                    }
                }
                // Only Get audio Stream permission if video stream is not present
                else {
                    navigator.mediaDevices.getUserMedia({ audio: "true" })
                        .then(stream => {
                            userStream = stream
                            userVideo.current.srcObject = stream;
                            setPermissionFlagMic(true)
                        })
                        .catch((err) => {
                            console.log(err);
                            setPermissionFlagMic(false)
                        })
                }

            }
        }
        // Only get Audio Stream
        else {
            navigator.mediaDevices.getUserMedia({ audio: "true" }).then(stream => {
                userStream = stream
                userVideo.current.srcObject = stream;
                setPermissionFlagMic(true)
            }).catch(err => {
                console.log(err);
                setPermissionFlagMic(false)
            })
        }

    }

    // console.log(peersRef?.current?.map(x => x.peer.streams.map(y => y.getTracks())).flatMap(x => x).map(x => x.filter(z => z.kind =="video")), "PeerRef");

    // console.log(userStream?.getTracks());
    // console.log(userStream, "UserStream");
    function shareScreen() {
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {

            const [videoTrack] = stream.getVideoTracks();
            peersRef.current.forEach((pc) => {
                const sender = pc.peer.getSenders().find((s) => s.track.kind === videoTrack.kind);
                console.log('Found sender:', sender);
                sender.replaceTrack(videoTrack);
            });


            // console.log(stream);
            // userStream = stream
            // userVideo.current.srcObject = stream;
            // let videoTrack = stream.getVideoTracks()[0];
            // let oldTrack = peersRef?.current?.map(x => x.peer.streams.map(y => y.getTracks())).flatMap(x => x)[0][0]
            // console.log(oldTrack);
            // // const videoTrack = userStream.getTracks().find(track => track.kind === "video")
            // let dataa = peersRef.current.forEach(x => {
            //     debugger
            //     let tempPeer = x.peer
            //     console.log(tempPeer);
            //     x.peer.replaceTrack(tempPeer.streams[0].getTracks()[0], videoTrack, stream)
            //     x.peer = tempPeer
            //     return null
            // })
            // // .forEach(x => x.replaceTrack(oldTrack, videoTrack, stream))
            // console.log(peersRef.current);


            // let dataa = peersRef.current.map(x => x.peer)[0].streams[0].getTracks()[0]
            // let videoTrack = stream.getVideoTracks()[0];
            // console.log(stream);
            // console.log(senders, "senders");
            // console.log(videoTrack, "Video Track");
            // console.log(stream, "Stream");
            // var sender = senders.current[0].streams[0].getTracks().find(x => x.kind == videoTrack.kind);
            // sender.addTrack(videoTrack);
            // console.log(sender);
        });
        // videoTrack.onended = function () {
        //     sender.replaceTrack(userStream.getTracks()[1]);
        // }


        // userStream = stream
        // const videoTrack = userStream.getTracks().find(track => track.kind === "video")
        // videoTrack.replaceTrack(stream)
        // const screenTrack = stream.getTracks()[0];
        // senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
        // screenTrack.onended = function () {
        //     senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
        // })
        // }
    }

    const handleVideoChange = () => {
        // debugger
        console.log(streamData);
        let stream = streamData;
        let oldTrack = stream.getVideoTracks()
        let newVideoTrack = userStream.getVideoTracks()[0].stop()
        let peer = peers[0].peer;
        console.log(oldTrack);
        console.log(newVideoTrack);
        peer.replaceTrack(oldTrack, newVideoTrack, stream)
        console.log(peer);
        // peer.on("signal", signal => { console.log(signal) })

        // let oldTrack = [...streamData].getVideoTracks()
        // let newTrack = userVideo.current.srcObject.getVideoTracks()
        // newTrack[0].enabled = false // To make camera stream to disable
        // newTrack[0].stop()  // To turn off camera session
        // console.log(oldTrack, "oldTrack");
        // console.log(newTrack, "newTrack");
    }

    console.log(peersRef.current);
    console.log(peers);
    return (
        <>
            <div className="meetingWrapper">
                <div className="conference">

                    <div className="Dish">
                        <StyledVideo muted ref={userVideo} autoPlay playsInline />

                        {peers.map((peer, index) => {
                            return (
                                <Video key={peer.peerID} peer={peer.peer} />
                            );
                        })}
                    </div>
                    <div className="micVideoWrapper">
                        <span className={`${`mediaButton ${permissionFlagMic ? 'mediaOn' : 'mediaOff'}`}`} style={{ cursor: "pointer" }} onClick={handleAudioStop}>{permissionFlagMic ? <MicIcon /> : <MicOffIcon />}</span>
                        {/* <span className={`${`mediaButton ${permissionFlagVideo ? 'mediaOn' : 'mediaOff'}`}`} style={{ cursor: "pointer" }} onClick={handleVideoStop}>{permissionFlagVideo ? <VideocamIcon /> : <VideocamOffIcon />}</span> */}
                        <span className={`${`mediaButton ${permissionFlagVideo ? 'mediaOn' : 'mediaOff'}`}`} style={{ cursor: "pointer" }} onClick={handleVideoChange}>{permissionFlagVideo ? <VideocamIcon /> : <VideocamOffIcon />}</span>
                    </div>
                </div>
            </div>
            {/* <button id="stop-video" onClick={handleVideoStop}>Stop Video</button>
            <button>Stop MIC</button>
            <button onClick={shareScreen}>Share Screen</button> */}
        </>
    );
};

export default Room;
