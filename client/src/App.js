import React from 'react';
import logo from './logo.svg';
import './App.css';
import socketIOClient from 'socket.io-client';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: '',
      playlist: [],
      endpoint: "http://localhost:9000"
    }
  }

  callAPI() {
    fetch("http://localhost:9000/getPlaylist")
        .then(res => res.json())
        .then(res => this.setState({ playlist: res }));
  }

  componentDidMount() {
    this.callAPI();
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on('songAdded', data => {
      this.setState({
        info: data,
      })
    });

    socket.on('skipCurrent', data => {
      this.setState({
        info: data,
      })
    });
  }

  render() {
    let playlist = this.state.playlist.map(item => {
      return <p>{item.title}</p>
    });
    return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p className="App-intro">In the queue: {playlist}</p>
            <p className="App-intro" style={this.state.info ? {'display' : 'block'} : {'display' : 'none'}}>{this.state.info}</p>
          </header>
        </div>
    );
  }
}

export default App;
