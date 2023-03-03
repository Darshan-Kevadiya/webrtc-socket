import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import JoinRoom from "./routes/JoinRoom";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" exact element={<CreateRoom />} />
          <Route path="*" exact element={<CreateRoom />} />
          <Route path="/room/:roomID" element={<JoinRoom />} />
          <Route path="/room/:roomID/name/:name" element={<Room />} />
        </Routes>

      </BrowserRouter>
    </div>
  );
}

export default App;
