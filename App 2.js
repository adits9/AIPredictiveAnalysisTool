import logo from './logo.svg';
import './App.css';
import DataVisualization from "./components/DataVisualization.js";
import Chatbot from "./components/Chatbot.js";


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <DataVisualization/>
        </div>
        <div>
          <Chatbot/>
        </div>
      </header>
    </div>
  );
}

export default App;
