import React from 'react';
import logo from './logo.svg';
import './App.css';
import socketIOClient from 'socket.io-client';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      apiResponse: {},
      endpoint: "http://localhost:9000"
    }
  }

  callAPI() {
    fetch("http://localhost:9000/current")
        .then(res => res.json())
        .then(res => this.setState({ apiResponse: res }));
  }

  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on('songAdded', data => {
      this.setState({
        apiResponse: data,
      })
    });
    // this.callAPI();
  }

  render() {
    console.log(this.state.apiResponse);
    return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p className="App-intro">Title: {this.state.apiResponse.title}</p>

          </header>
        </div>
    );
  }
}

export default App;
