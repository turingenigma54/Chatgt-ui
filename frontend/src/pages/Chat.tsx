import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {Container,Form,Button,InputGroup,ListGroup,Navbar,Nav,} from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

const Chat: React.FC = () => {
  const { token, setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;
  
    const userMessage: Message = { sender: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
  
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/chat`,
        { prompt: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const assistantMessage: Message = {
        sender: 'assistant',
        text: response.data.response,
      };
  
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Error communicating with the assistant.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null); // Update the context
    navigate('/login');
  };

  return (
    <Container fluid className="d-flex flex-column min-vh-100 p-0">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#">Ollama Chat</Navbar.Brand>
        <Nav className="ml-auto">
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>
      </Navbar>
      <Container className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: '#000' }}>
        <ListGroup variant="flush" className="flex-grow-1 overflow-auto mt-3">
          {messages.map((msg, index) => (
            <ListGroup.Item
              key={index}
              style={{
                backgroundColor: '#000',
                color: '#00ff00',
                textAlign: msg.sender === 'user' ? 'right' : 'left',
                border: 'none',
              }}
            >
              <strong>{msg.sender === 'user' ? 'You' : 'Assistant'}:</strong> {msg.text}
            </ListGroup.Item>
          ))}
          <div ref={messagesEndRef} />
        </ListGroup>
        <Form className="mb-3">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button variant="primary" onClick={handleSend}>
              Send
            </Button>
          </InputGroup>
        </Form>
      </Container>
    </Container>
  );
};

export default Chat;