import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const App = () => {
  const [stompClient, setStompClient] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [color, setColor] = useState('white'); // 초기 색상 설정
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.connect({}, frame => {
      console.log('Connected: ' + frame);
      client.subscribe('/topic/draw', message => {
        const drawMessage = JSON.parse(message.body);
        setDrawings(prevDrawings => [...prevDrawings, drawMessage]);
      });
    });
    setStompClient(client);
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineWidth = 5;
    context.lineCap = 'round';
    contextRef.current = context;
  }, []);

  const startDrawing = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    isDrawingRef.current = true;
    contextRef.current.beginPath(); // 새로운 경로 시작
    contextRef.current.moveTo(offsetX, offsetY);
    sendDrawing({ x: offsetX, y: offsetY, color: color });
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    contextRef.current.beginPath(); // 새로운 경로 시작
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;
    const { offsetX, offsetY } = event.nativeEvent;
    contextRef.current.strokeStyle = color; // 현재 색상으로 설정
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    sendDrawing({ x: offsetX, y: offsetY, color: color });
  };

  const sendDrawing = (content) => {
    if (stompClient) {
      const drawMessage = {
        user: 'User1', // 나중에 유저를 동적으로 설정할 수 있습니다.
        content: content
      };
      stompClient.send('/app/draw', {}, JSON.stringify(drawMessage));
    }
  };

  useEffect(() => {
    if (drawings.length === 0) return;

    const context = contextRef.current;
    drawings.forEach(drawing => {
      context.beginPath(); // 새로운 경로 시작
      const { x, y, color } = drawing.content;
      context.strokeStyle = color;
      context.moveTo(x, y);
      context.lineTo(x, y);
      context.stroke();
    });
  }, [drawings]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Drawing Together</h1>
        <div 
          style={{ backgroundColor: 'red', width: '50px', height: '50px' }}
          onClick={() => setColor('red')}
        ></div>
        <div 
          style={{ backgroundColor: 'blue', width: '50px', height: '50px' }}
          onClick={() => setColor('blue')}
        ></div>
        <canvas 
          ref={canvasRef} 
          id="drawingCanvas" 
          width="800" 
          height="600"
          style={{ backgroundColor: '#2C2C2C' }} // 캔버스 배경 색 설정
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
        ></canvas>
        <div>
          {drawings.map((drawing, index) => (
            <div key={index}>
              {drawing.user}: ({drawing.content.x}, {drawing.content.y}) - {drawing.content.color}
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
