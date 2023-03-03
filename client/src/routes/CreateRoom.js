import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { v1 as uuid } from "uuid";
// import MicIcon from '@mui/icons-material/Mic';
// import MicOffIcon from '@mui/icons-material/MicOff';
// import VideocamIcon from '@mui/icons-material/Videocam';
// import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AddBoxIcon from '@mui/icons-material/AddBox';
import Caldender from '../assets/bg-calender.jpg'
import NearMeIcon from '@mui/icons-material/NearMe';
import moment from "moment/moment";


const CreateRoom = (props) => {

    const [timeString, setTimeString] = useState(moment().format('LTS'))
    const [showInput, setShowInput] = useState(false)

    const navigate = useNavigate()
    const [roomId, setRoomId] = useState('')
    const handleCreateRoom = () => {
        const id = uuid();
        navigate(`/room/${id}`)
    }

    const handleCreateJoinRoom = () => {
        navigate(`/room/${roomId}`)
    }

    const handleRoomId = (e) => {
        setRoomId(e.target.value)
    }

    setInterval(() => {
        let currentTime = moment().format('LTS');
        // let hour = currentTime.slice(0, 2)
        // let minute = currentTime.slice(3, 5)
        // let time = currentTime.slice(6, 8)
        // let meridaion = currentTime.slice(9, 11)

        // setTimeString(`${hour}:${minute}:${time} ${meridaion}`)
        setTimeString(currentTime)
    }, 1000)

    const handleJoinRoom = () => {
        setShowInput(true)
    }

    return (
        <div style={{ height: "100vh", display: 'flex', alignItems: "center" }}>

            <div className="CreateRoomWrapper" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: 'column' }}>
                <div className="DateTimeWrapper">
                    <img src={Caldender} style={{ width: "100%", height: "100%" }} />
                    <div className="dateTime_Content">
                        <div className="time">{timeString}</div>
                        <div className="date">{moment().format('dddd, MMMM, DD, YYYY')}</div>
                    </div>
                </div>
                <div className="d-flex justify-content-center align-items-center flex-column mt-2" style={{ gap: "20px", height: "50%", width: '100%' }}>
                    <div className="d-flex justify-content-evenly w-100">
                        <div className="buttonWrapperJoin">
                            <a className="CreateRoom" onClick={handleCreateRoom}><VideoCallIcon /></a>
                            <div>Create</div>
                        </div>
                        <div className="buttonWrapperJoin">
                            <a className="JoinRoom" onClick={handleJoinRoom}><AddBoxIcon /></a>
                            <div>Join</div>
                        </div>
                    </div>
                    {showInput && <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <input type="text" className="joinTextBox col-8" onChange={handleRoomId} />
                        <a className="joinInputButton" onClick={handleCreateJoinRoom}><NearMeIcon /></a>
                    </div>}
                </div>
            </div >

        </div>
    );
};

export default CreateRoom;
