import React, { useState } from 'react';

import Papa from 'papaparse';

const Button = ({ children, ...props }) => (
  <button {...props} style={{ padding: '8px 12px', margin: '5px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>
    {children}
  </button>
);

const Slider = ({ min, max, value, onValueChange }) => (
  <input
    type=\"range\"
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
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Motion Estimation Visualizer</h1>

      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />

      {motionData.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <Slider
              min={0}
              max={motionData.length - 1}
              value={[currentIndex]}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <span className="ml-4">Frame {currentIndex}</span>
          </div>

          <div className="mt-4 border p-4 rounded-lg bg-gray-100">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(currentFrame, null, 2)}
            </pre>
            {flags[currentIndex] && (
              <p className="text-blue-600 font-semibold mt-2">
                Flag: {flags[currentIndex]}
              </p>
            )}
          </div>

          <div className="flex space-x-2 mt-4">
            <Button onClick={() => addFlag('T-cue')}>Add T-cue</Button>
            <Button onClick={() => addFlag('T-first-movement')}>Add T-first-movement</Button>
          </div>
        </>
      )}
    </div>
  );
}
