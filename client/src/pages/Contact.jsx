import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import '../styles/Doc.css';

const Contact = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Your message has been sent.');
    setMessage('');
  };

  return (
    <div className="tk-doc">
      <NavBar />
      <div className="tk-doc__split">
        <header>
          <h1 className="tk-doc__title">Talk to us.</h1>
          <p className="tk-doc__lede">
            Questions about the portal, or something that is not a grievance? Write here. To complain about a
            public service, <Link to="/submit-grievance">file a grievance</Link> instead, so it gets a petition ID and a timeline.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="tk-doc__form">
          <label htmlFor="message" className="form-label">Message</label>
          <textarea
            id="message"
            className="form-control"
            rows="7"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-lg">Send message</button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
