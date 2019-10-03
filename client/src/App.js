import React from 'react';
import 'bulma';
import './App.css';
import socketIOClient from 'socket.io-client';

import NavBar from "./Navbar";
import Message from "./Message";
import MusicContent from "./MusicContent";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: '',
      playlist: null,
      current: null,
      previous: null,
      endpoint: 'http://localhost:9000'
    };

    const { endpoint } = this.state;
    this.socket = socketIOClient(endpoint);

    this.clearInfo = this.clearInfo.bind(this);
  }

  componentDidMount() {
    fetch("http://localhost:9000/getData")
        .then(res => res.json())
        .then(res => this.setState({
          playlist: res.playlist,
          current: res.current,
          previous: res.previous,
        }));

    this.socket.on('songAdded', data => {
      if(this.state.playlist === null && this.state.current === null) {
        this.setState({
          info: data.info,
          current: data.current,
        });
      }
      else {
        this.setState({
          info: data.info,
          playlist: data.playlist,
        });
      }
    });

    this.socket.on('skipCurrent', data => {
      this.setState({
        info: data.info,
        playlist: data.playlist,
        current: data.current,
        previous: data.previous,
      });

    });
  }

  clearInfo(delay) {
    setTimeout(() => {
      this.setState({
        info: ''
      })
    },  delay)
  }

  render() {
    return (
        <div className="container is-fluid">
          <NavBar />
          <section className="section">
            <MusicContent {...this.state} />
          </section>

          {this.state.info ? <Message data={this.state.info} handleClear={this.clearInfo} socket={this.socket}/> : null}
        </div>
    );
  }
}

export default App;
