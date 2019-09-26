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
      apiData: [],
      endpoint: "http://localhost:9000"
    };

    this.clearInfo = this.clearInfo.bind(this);
  }

  callAPI() {
    fetch("http://localhost:9000/getData")
        .then(res => res.json())
        .then(res => this.setState({ apiData: res }));
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

  clearInfo(delay) {
    setTimeout(() => {
      this.setState({
        info: ''
      })
    },  delay)
  }

  render() {
    // let playlist = this.state.apiData.map(item => { //TODO apidata.playlist
    //   return <p>{item.title}</p>
    // });
    return (
        <div className="container">
          <NavBar />
          <MusicContent current={playlist}/>
          {this.state.info ? <Message data={this.state.info} handleClear={this.clearInfo}/> : null}
        </div>
    );
  }
}

export default App;
