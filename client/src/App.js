import React from 'react';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { apiResponse: {} }
  }

  callAPI() {
    fetch("http://localhost:9000/current")
        .then(res => res.json())
        .then(res => this.setState({ apiResponse: res }));
  }

  componentDidMount() {
    this.callAPI();
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
