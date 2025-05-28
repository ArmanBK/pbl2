import React, { useState, useRef, useEffect } from 'react';
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

const SKELETON_EDGES = [
  ['NOSE', 'LEFT_EYE'],
  ['NOSE', 'RIGHT_EYE'],
  ['LEFT_EYE', 'LEFT_EAR'],
  ['RIGHT_EYE', 'RIGHT_EAR'],
  ['LEFT_SHOULDER', 'RIGHT_SHOULDER'],
  ['LEFT_SHOULDER', 'LEFT_ELBOW'],
  ['LEFT_ELBOW', 'LEFT_WRIST'],
  ['RIGHT_SHOULDER', 'RIGHT_ELBOW'],
  ['RIGHT_ELBOW', 'RIGHT_WRIST'],
  ['LEFT_SHOULDER', 'LEFT_HIP'],
  ['RIGHT_SHOULDER', 'RIGHT_HIP'],
  ['LEFT_HIP', 'RIGHT_HIP'],
  ['LEFT_HIP', 'LEFT_KNEE'],
  ['LEFT_KNEE', 'LEFT_ANKLE'],
  ['RIGHT_HIP', 'RIGHT_KNEE'],
  ['RIGHT_KNEE', 'RIGHT_ANKLE'],
];

const drawSkeleton = (ctx, keypoints) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'red';

  SKELETON_EDGES.forEach(([a, b]) => {
    const p1 = keypoints[a];
    const p2 = keypoints[b];
    if (p1 && p2 && p1.x != null && p2.x != null) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });

  Object.values(keypoints).forEach((p) => {
    if (p && p.x != null && p.y != null) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
};

export default function MotionVisualizer() {
  const [motionData, setMotionData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flags, setFlags] = useState({});
  const canvasRef = useRef();
  const [timeInput, setTimeInput] = useState('');

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: (result) => {
      const raw = result.data.filter((row) => Object.keys(row).length > 1 && row.timestamp);

      // Parse timestamps to seconds
      const parsed = raw.map((row, i) => {
        const t = new Date(row.timestamp);
        return { ...row, _parsedTimestamp: t.getTime() / 1000 };
      });

      const start = parsed[0]._parsedTimestamp;
      const withRelativeTime = parsed.map((row) => ({
        ...row,
        timestamp: row._parsedTimestamp - start,
      }));

      setMotionData(withRelativeTime);
      setCurrentIndex(0);
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

  const downloadAnnotatedData = () => {
    if (!motionData.length) return;
    const annotated = motionData.map((row, index) => ({ ...row, Flag: flags[index] || '' }));
    const csv = Papa.unparse(annotated);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotated_motion_data.csv';
    a.click();
  };

  const getKeypointsFromRow = (row) => {
    const keypoints = {};
    Object.entries(row).forEach(([key, value]) => {
      const match = key.match(/^KeypointType\.(\w+)_([xy])$/);
      if (match) {
        const [, name, coord] = match;
        if (!keypoints[name]) keypoints[name] = {};
        keypoints[name][coord] = value;
      }
    });
    return keypoints;
  };

  const goToTime = () => {
    const time = parseFloat(timeInput);
    if (!isNaN(time)) {
      const index = motionData.findIndex((row) => row.timestamp >= time);
      if (index !== -1) setCurrentIndex(index);
    }
  };

  useEffect(() => {
    if (motionData.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const row = motionData[currentIndex];
      const keypoints = getKeypointsFromRow(row);
      drawSkeleton(ctx, keypoints);
    }
  }, [motionData, currentIndex]);

  const currentFrame = motionData[currentIndex];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}>Previous</Button>
              <p>
                Frame {currentIndex} / Time: {currentFrame?.timestamp?.toFixed(2)}s
              </p>
              <Button onClick={() => setCurrentIndex((i) => Math.min(motionData.length - 1, i + 1))}>Next</Button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="Jump to time (s)"
                style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '6px' }}
              />
              <Button onClick={goToTime}>Go</Button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{ border: '1px solid #ccc', marginBottom: '10px' }}
          />

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
            <Button onClick={downloadAnnotatedData}>Download CSV</Button>
          </div>
        </>
      )}
    </div>
  );
}
