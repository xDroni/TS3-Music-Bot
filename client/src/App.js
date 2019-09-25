import React from 'react';
import './App.css';
import 'bulma';
import socketIOClient from 'socket.io-client';

import Navbar from "./Navbar";
import Message from "./Message";
import MusicContent from "./MusicContent";

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
      });
      this.callAPI();
    });

    socket.on('skipCurrent', data => {
      this.setState({
        info: data,
      });
      this.callAPI();
    });
  }

  render() {
    let playlist = this.state.playlist.map(item => {
      return <p>{item.title}</p>
    });
    console.log('info', this.state.info);
    return (
        <div className="container">
          <Navbar/>
          {this.state.info  && <Message data={this.state.info}/>}
          <MusicContent/>
        </div>

    );
  }
}

export default App;
