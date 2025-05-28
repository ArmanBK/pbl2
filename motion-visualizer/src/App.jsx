import React, { useState } from 'react';
import Papa from 'papaparse';

const Button = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      padding: '8px 12px',
      margin: '5px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

const Slider = ({ min, max, value, onValueChange }) => (
  <input
    type="range"
    min={min}
    max={max}
    value={value[0]}
    onChange={(e) => onValueChange([parseInt(e.target.value)])}
    style={{ width: '100%' }}
  />
);

export default function MotionVisualizer() {
  const [motionData, setMotionData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flags, setFlags] = useState({});

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        setMotionData(result.data);
      },
    });
  };

  const handleSliderChange = (value) => {
    setCurrentIndex(value[0]);
  };

  const addFlag = (type) => {
    setFlags({
      ...flags,
      [currentIndex]: type,
    });
  };

  const currentFrame = motionData[currentIndex];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Motion Estimation Visualizer</h1>

      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginTop: '10px' }} />

      {motionData.length > 0 && (
        <>
          <div style={{ marginTop: '20px' }}>
            <Slider
              min={0}
              max={motionData.length - 1}
              value={[currentIndex]}
              onValueChange={handleSliderChange}
            />
            <p>Frame {currentIndex}</p>
          </div>

          <div style={{ background: '#f3f3f3', padding: '10px', borderRadius: '8px' }}>
            <pre>{JSON.stringify(currentFrame, null, 2)}</pre>
            {flags[currentIndex] && (
              <p style={{ color: '#2563eb', fontWeight: 'bold' }}>
                Flag: {flags[currentIndex]}
              </p>
            )}
          </div>

          <div>
            <Button onClick={() => addFlag('T-cue')}>Add T-cue</Button>
            <Button onClick={() => addFlag('T-first-movement')}>Add T-first-movement</Button>
          </div>
        </>
      )}
    </div>
  );
}
