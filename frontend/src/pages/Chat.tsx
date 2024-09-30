import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { Trash, Clipboard } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, InputGroup, ListGroup, Navbar, Nav } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: number;
}

interface Conversation {
  conversation_id: string;
  last_message: string;
  timestamp: number;
}

const Chat: React.FC = () => {
  const { token, setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!token) return;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/conversations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, [token]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/conversations/${activeConversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [activeConversationId, token]);

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
        {
          prompt: input,
          conversation_id: activeConversationId,
        },
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

      if (!activeConversationId) {
        setActiveConversationId(response.data.conversation_id);
        setConversations((prevConversations) => [
          {
            conversation_id: response.data.conversation_id,
            last_message: assistantMessage.text,
            timestamp: Date.now(),
          },
          ...prevConversations,
        ]);
      } else {
        setConversations((prevConversations) =>
          prevConversations.map((convo) =>
            convo.conversation_id === activeConversationId
              ? {
                  ...convo,
                  last_message: assistantMessage.text,
                  timestamp: Date.now(),
                }
              : convo
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('Error communicating with the assistant.');
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!token) return;
  
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
    if (!confirmDelete) return;
  
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setConversations((prevConversations) =>
        prevConversations.filter((convo) => convo.conversation_id !== conversationId)
      );
  
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete the conversation.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    navigate('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const renderMessageContent = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            return match ? (
              <div style={{ position: 'relative' }}>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  style={{ 
                    position: 'absolute', 
                    right: '5px', 
                    top: '5px',
                    zIndex: 1
                  }}
                  onClick={() => copyToClipboard(codeString)}
                >
                  <Clipboard />
                </Button>
                <SyntaxHighlighter
                  style={dark as any}
                  language={match[1]}
                  PreTag="div"
                  {...props as any}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <Container fluid className="d-flex flex-column min-vh-100 p-0">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#">Ollama Chat</Navbar.Brand>
        <Nav className="ml-auto">
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>
      </Navbar>
      <Container fluid className="d-flex flex-grow-1 p-0">
        <div style={{ width: '250px', backgroundColor: '#111', color: '#fff' }}>
          <Button variant="primary" onClick={handleNewConversation} className="m-2">
            + New Conversation
          </Button>
          <ListGroup variant="flush">
            {conversations.map((convo) => (
            <ListGroup.Item
              key={convo.conversation_id}
              active={convo.conversation_id === activeConversationId}
              style={{ cursor: 'pointer', backgroundColor: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span onClick={() => setActiveConversationId(convo.conversation_id)}>
                {convo.last_message.substring(0, 20) || 'New Conversation'}
              </span>
              <Button variant="link" onClick={() => handleDeleteConversation(convo.conversation_id)} style={{ color: '#fff' }}>
                <Trash />
              </Button>
            </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
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
                <strong>{msg.sender === 'user' ? 'You' : 'Assistant'}:</strong>{' '}
                {renderMessageContent(msg.text)}
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
    </Container>
  );
};

export default Chat;