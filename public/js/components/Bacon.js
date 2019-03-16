import React from 'react';
alert("Bacon");
let bacon = 5;
class Bacon extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value1: '',value2: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }
    
    componentDidMount() {
    window.addEventListener('load', this.handleLoad);
 }

 handleLoad() {
  $.get("/userInfo",function(data){
		if (data.username)
			$("#session").html("Session " + data.username);
	});
 }
    
  handleChange(event) {
    this.setState({value1: event.target.value});
  }

  handleSubmit(event) {
      $.get("/logout",function(data){
		window.location = data.redirect;
	});
     //remove eventDefault 
    event.preventDefault();
    return false;
  }

  render() {
    return (
    <div className="container">
        <h1 id="session">Home</h1>
          <form onSubmit={this.handleSubmit}>
            <input type="submit" value="Logout" />
          </form>
    </div>
    );
  }
}

export default Bacon;