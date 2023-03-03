import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { v1 as uuid } from "uuid";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import { useParams } from "react-router";

const JoinRoom = () => {
    const [name, setName] = useState('')
    const [userStream, setUserStream] = useState('')
    const [permissionFlagMic, setPermissionFlagMic] = useState(false)
    const [permissionFlagVideo, setPermissionFlagVideo] = useState(false)
    const mediaStream = useRef({})
    const navigate = useNavigate()
    const { roomID } = useParams()
    function create() {
        navigate(`/room/${roomID}/name/${name}`)
        localStorage.setItem("Username", name)
    }

    useEffect(() => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        function generateString(length) {
            let result = ' ';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            return result;
        }
        let name = generateString(5)

        setName(name.trim())

        let streamData = ''
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            console.log(stream);
            streamData = stream
            setUserStream(stream)
            setPermissionFlagMic(true)
            setPermissionFlagVideo(true)
            mediaStream.current.srcObject = stream
        }).catch((err) => {
            setPermissionFlagMic(false)
            setPermissionFlagVideo(false)
            console.log(err);
            document.getElementById('cameraOn').style.display = 'none'
            document.getElementById('cameraOFFWrapper').style.display = 'flex'
        })

        return () => {
            streamData?.getAudioTracks()[0]?.stop()
            streamData?.getVideoTracks()[0]?.stop()
        }
    }, [])


    const setPermission = (type, value) => {
        let permission = JSON.parse(localStorage.getItem("permission"))
        let keys = permission && Object.keys(permission)
        let perm = keys?.filter(x => x != [type])[0]
        console.log(type, "type");
        if (keys?.filter(x => x != [type]).length) {
            let obj = { [type]: value, [perm]: perm == "video" ? permission.video : permission.mic }
            localStorage.setItem("permission", JSON.stringify(obj))
        }
        else {
            localStorage.setItem("permission", JSON.stringify({ [type]: value }))
        }
    }


    const handleMic = () => {
        if (userStream) {
            // Get Audio Stream from userStream
            let stream = userStream.getAudioTracks()
            // To Turn audio OFF
            if (stream[0]?.enabled) {
                stream[0].enabled = false // To make audio stream to disable
                // stream[0].stop()  // To turn off audio session
                setPermissionFlagMic(false)
                setPermission("mic", false)
            }
            // To Turn Audio ON
            else {
                // Check Wheather video stream is present OR Not
                let userDataVideo = userStream.getVideoTracks()
                if (userDataVideo.length) {
                    // If video stream is already present and active grant access of video and audio
                    if (userDataVideo[0].enabled) {
                        navigator.mediaDevices.getUserMedia({ audio: "true", video: "true" })
                            .then(stream => {
                                setUserStream(stream)
                                setPermissionFlagMic(true)
                                mediaStream.current.srcObject = stream
                                setPermission("mic", true)
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
                                setUserStream(stream)
                                mediaStream.current.srcObject = stream
                                setPermissionFlagMic(true)
                                setPermission("mic", true)
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
                            setUserStream(stream)
                            mediaStream.current.srcObject = stream
                            setPermissionFlagMic(true)
                            setPermission("mic", true)
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
                setUserStream(stream)
                mediaStream.current.srcObject = stream
                setPermissionFlagMic(true)
                setPermission("mic", true)
            }).catch(err => {
                console.log(err);
                setPermissionFlagMic(false)
            })
        }
    }



    const handleVideo = () => {
        // Check Wheather Permission is Granted OR Not
        // If Permission is Granted stream is present in userStream
        if (userStream) {
            // Get Video Stream from userStream
            let stream = userStream.getVideoTracks()
            // To Turn Camera On
            if (stream[0]?.enabled) {
                stream[0].enabled = false // To make camera stream to disable
                stream[0].stop()  // To turn off camera session
                setPermissionFlagVideo(false)
                setPermission("video", false)
                document.getElementById('cameraOn').style.display = 'none'
                document.getElementById('cameraOFFWrapper').style.display = 'flex'
            }
            // To Turn Camera OFF
            else {
                // Check Wheather Audio stream is present OR Not
                let userDataAudio = userStream.getAudioTracks()
                if (userDataAudio.length) {
                    // If audio stream is already present and active grant access of video and audio
                    if (userDataAudio[0].enabled) {

                        navigator.mediaDevices.getUserMedia({ audio: "true", video: "true" })
                            .then(stream => {
                                setUserStream(stream)
                                setPermissionFlagVideo(true)
                                setPermission("video", true)
                                mediaStream.current.srcObject = stream
                                document.getElementById('cameraOn').style.display = 'block'
                                document.getElementById('cameraOFFWrapper').style.display = 'none'
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagVideo(false)
                                document.getElementById('cameraOn').style.display = 'none'
                                document.getElementById('cameraOFFWrapper').style.display = 'flex'
                            })
                    }
                    // Else Grant access to only video
                    else {
                        navigator.mediaDevices.getUserMedia({ video: "true" })
                            .then(stream => {
                                setUserStream(stream)
                                mediaStream.current.srcObject = stream
                                setPermissionFlagVideo(true)
                                setPermission("video", true)
                                document.getElementById('cameraOn').style.display = 'block'
                                document.getElementById('cameraOFFWrapper').style.display = 'none';
                            })
                            .catch((err) => {
                                console.log(err);
                                setPermissionFlagVideo(false)
                                document.getElementById('cameraOn').style.display = 'none'
                                document.getElementById('cameraOFFWrapper').style.display = 'flex'
                            })
                    }
                }
                // Only Get video Stream permission if audio stream is not present
                else {
                    navigator.mediaDevices.getUserMedia({ video: "true" }).then(stream => {
                        setUserStream(stream)
                        mediaStream.current.srcObject = stream
                        setPermissionFlagVideo(true)
                        setPermission("video", true)
                        document.getElementById('cameraOn').style.display = 'block'
                        document.getElementById('cameraOFFWrapper').style.display = 'none'
                    }).catch(err => {
                        console.log(err);
                        setPermissionFlagVideo(false)
                        document.getElementById('cameraOn').style.display = 'none'
                        document.getElementById('cameraOFFWrapper').style.display = 'flex'
                    })
                }

            }
        }
        // Only get Video Stream
        else {
            navigator.mediaDevices.getUserMedia({ video: "true" }).then(stream => {
                setUserStream(stream)
                mediaStream.current.srcObject = stream
                setPermissionFlagVideo(true)
                setPermission("video", true)
                document.getElementById('cameraOn').style.display = 'block'
                document.getElementById('cameraOFFWrapper').style.display = 'none'
            }).catch(err => {
                console.log(err);
                setPermissionFlagVideo(false)
                document.getElementById('cameraOn').style.display = 'none'
                document.getElementById('cameraOFFWrapper').style.display = 'flex'
            })
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
    }

    return (
        <>
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", position: 'relative' }}>
                <div className="JoinRoomCard" >
                    <div className="col-12" style={{ height: '450px', position: 'relative', display: "flex", alignItems: 'center', borderRadius: "inherit" }}>
                        <video id="cameraOn" ref={mediaStream} autoPlay style={{ width: "100%", height: "inherit", objectFit: "unset", borderRadius: "inherit" }} />
                        <div id="cameraOFFWrapper" style={{ display: 'none' }}>Camera is Off</div>
                        <div className="micVideoWrapperJoinRoom">
                            <span className={`${`mediaButton ${permissionFlagMic ? 'mediaOn' : 'mediaOff'}`}`} style={{ cursor: "pointer" }} onClick={handleMic}>{permissionFlagMic ? <MicIcon /> : <MicOffIcon />}</span>
                            <span className={`${`mediaButton ${permissionFlagVideo ? 'mediaOn' : 'mediaOff'}`}`} style={{ cursor: "pointer" }} onClick={handleVideo}>{permissionFlagVideo ? <VideocamIcon /> : <VideocamOffIcon />}</span>
                        </div>
                    </div>
                    <div className="my-4" style={{ display: 'flex', justifyContent: 'center', gap: "10px" }}>
                        <input type="text" className='col-5' placeholder="Enter Your name" onChange={(e) => setName(e.target.value)} value={name} />
                        <button className="btn btn-primary" onClick={create}>Join room</button>
                    </div>
                </div>
            </div >
            <Tooltip title="Copy to clipboard" arrow>
                <div className="CopyLink" onClick={copyLink}>
                    <div className="linkWrapper">
                        {window.location.href}
                    </div>
                    <div>
                        <ContentCopyIcon />
                    </div>
                </div>
            </Tooltip>
        </>
    )
}

export default JoinRoom