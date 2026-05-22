'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, ImageIcon, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import styles from '../app/page.module.css';

const POSE_CONNECTIONS = [
  // Face/Head
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],

  // Torso and Upper limbs
  [11, 12], // Left shoulder - Right shoulder
  [11, 13], [13, 15], // Left arm: shoulder - elbow - wrist
  [12, 14], [14, 16], // Right arm: shoulder - elbow - wrist

  // Left hand fingers
  [15, 17], [17, 19], [19, 21], [15, 21],
  // Right hand fingers
  [16, 18], [18, 20], [20, 22], [16, 22],

  // Torso side lines & hip
  [11, 23], [12, 24],
  [23, 24], // Left hip - Right hip

  // Lower limbs (Legs)
  [23, 25], [25, 27], // Left leg: hip - knee - ankle
  [24, 26], [26, 28], // Right leg: hip - knee - ankle

  // Left foot
  [27, 29], [29, 31], [27, 31],
  // Right foot
  [28, 30], [30, 32], [28, 32]
];

interface ImageRecognitionViewProps {
  socket: any; // Socket.io-client instance
  isConnected: boolean;
  socketUrl?: string;
}

export const ImageRecognitionView: React.FC<ImageRecognitionViewProps> = ({
  socket,
  isConnected,
  socketUrl = 'http://localhost:8000',
}) => {
  const apiBaseUrl = socketUrl.replace(/\/$/, '');
  const [selectedModel, setSelectedModel] = useState<'dnn' | 'rf'>('dnn');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
    points: any;
    allPoints?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hàm gọi API nhận diện online bằng fetch POST
  const sendPredictionRequest = async (base64String: string, model: 'dnn' | 'rf') => {
    try {
      const response = await fetch(`${apiBaseUrl}/predict-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sk_ai_7Xq9Lm2PzR8vNc4KbY1DfH6TwS3JuE5',
        },
        body: JSON.stringify({
          image: base64String,
          model: model,
        }),
      });

      if (!response.ok) {
        throw new Error(`API online trả về mã lỗi: ${response.status}`);
      }

      const data = await response.json();
      setResult({
        label: data.label,
        confidence: data.confidence,
        points: data.points,
        allPoints: data.allPoints,
      });
    } catch (error) {
      console.error('Lỗi kết nối tới API nhận diện online:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const frameSeqRef = useRef<number>(0);
  const latestProcessedFrameIdRef = useRef<number>(0);

  // Vòng lặp capture và nhận diện frame từ video khi đang phát bằng API online
  useEffect(() => {
    let intervalId: any = null;

    if (isVideoMode && isPlaying && videoPreview) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Đặt lại các số thứ tự khi bắt đầu phát video
      frameSeqRef.current = 0;
      latestProcessedFrameIdRef.current = 0;

      intervalId = setInterval(async () => {
        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
          // Resize frame về 400x300 để truyền tải nhẹ nhàng
          canvas.width = 400;
          canvas.height = 300;
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }
          const base64String = canvas.toDataURL('image/jpeg', 0.6);
          frameSeqRef.current += 1;
          const currentFrameId = frameSeqRef.current;

          try {
            const response = await fetch(`${apiBaseUrl}/predict-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'sk_ai_7Xq9Lm2PzR8vNc4KbY1DfH6TwS3JuE5',
              },
              body: JSON.stringify({
                image: base64String,
                model: selectedModel,
                frameId: currentFrameId,
              }),
            });

            if (response.ok) {
              const data = await response.json();

              // Lọc bỏ phản hồi cũ đến chậm do xử lý bất đồng bộ
              if (currentFrameId < latestProcessedFrameIdRef.current) {
                return;
              }
              latestProcessedFrameIdRef.current = currentFrameId;

              setResult({
                label: data.label,
                confidence: data.confidence,
                points: data.points,
                allPoints: data.allPoints,
              });
            }
          } catch (err) {
            console.error('Lỗi nhận diện video frame online:', err);
          }
        }
      }, 100); // 10 FPS (100ms một khung hình)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVideoMode, isPlaying, videoPreview, selectedModel, apiBaseUrl]);

  // Xử lý khi chọn file ảnh / video từ nút bấm duyệt file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    setIsVideoMode(isVideo);
    setResult(null);
    setIsPlaying(false);

    if (isVideo) {
      // Dành cho Video: Tạo object URL trực tiếp để tối ưu bộ nhớ
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      setImagePreview(null);
    } else {
      // Dành cho Ảnh: Chuyển đổi thành base64 và gửi lên AI ngay lập tức
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setVideoPreview(null);

        // Gửi ảnh sang API online
        setIsProcessing(true);
        sendPredictionRequest(base64String, selectedModel);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trình kích hoạt click input file
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      processFile(file);
    }
  };

  // Chuyển đổi mô hình dự đoán và chạy lại ảnh cũ nếu có
  const changeModel = (model: 'dnn' | 'rf') => {
    setSelectedModel(model);
    if (!isVideoMode && imagePreview) {
      setIsProcessing(true);
      sendPredictionRequest(imagePreview, model);
    }
  };

  // Quy đổi nhãn sang Tiếng Việt
  const getGestureNameVi = (label: string) => {
    const map: Record<string, string> = {
      'AHEAD': 'DI CHUYỂN THẲNG',
      'RIGHT': 'RẼ PHẢI',
      'LEFT': 'RẼ TRÁI',
      'STOP': 'DỪNG LẠI',
      'NONE': 'Không phát hiện cử chỉ',
      'Chưa phát hiện': 'Không phát hiện cử chỉ'
    };
    return map[label] || label;
  };

  // Lấy mô tả chi tiết của cử chỉ
  const getGestureDescVi = (label: string) => {
    const map: Record<string, string> = {
      'AHEAD': 'Giơ thẳng hai tay song song từ khuỷu tay lên trên đầu, lòng bàn tay hướng vào trong. Điều hướng máy bay tiếp tục đi thẳng vào vạch chỉ dẫn.',
      'RIGHT': 'Giơ tay phải ngang vai và vẫy tay trái qua đầu để báo hiệu phi công bẻ lái rẽ sang hướng bên phải (phía của phi công).',
      'LEFT': 'Giơ tay trái ngang vai và vẫy tay phải qua đầu để báo hiệu phi công bẻ lái rẽ sang hướng bên trái (phía của phi công).',
      'STOP': 'Giơ chéo hai tay hình chữ X trước mặt hoặc trên đầu, lòng bàn tay mở rộng. Báo hiệu phanh dừng khẩn cấp máy bay tại Gate.',
      'NONE': 'Định dạng hình ảnh hoặc khung hình video không chứa khớp cử chỉ điều phối chuẩn chỉnh của nhân viên hàng không.'
    };
    return map[label] || 'Vui lòng đảm bảo hình ảnh/video hiển thị rõ ràng toàn thân từ thắt lưng trở lên của nhân viên điều phối.';
  };

  // Không cần đảo ngược - Backend đã lật frame rồi
  const getUnmirroredPoints = (pts: any) => pts;  // Dùng tọa độ gốc

  const displayPoints = result && result.points ? getUnmirroredPoints(result.points) : null;
  const displayAllPoints = result && result.allPoints ? getUnmirroredPoints(result.allPoints) : null;

  return (
    <main className="image-recognition-container">
      {/* Cấu trúc Style CSS nội bộ để có giao diện Premium Glassmorphism */}
      <style jsx>{`
        .image-recognition-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1.5rem;
          width: 100%;
          min-height: calc(100vh - 180px);
        }
        @media (max-width: 968px) {
          .image-recognition-container {
            grid-template-columns: 1fr;
          }
        }
        .left-col, .right-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .panel-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        .panel-title {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem;
        }
        .panel-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .model-selector-bar {
          display: flex;
          background: rgba(255, 255, 255, 0.85);
          padding: 0.25rem;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          margin-bottom: 0.5rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(10px);
        }
        .model-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .model-tab:hover {
          color: #1e3a8a;
          background: rgba(30, 58, 138, 0.04);
        }
        .model-tab-active-dnn {
          background: #1e3a8a !important;
          color: #ffffff !important;
          border: 1px solid #1e3a8a;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
        }
        .model-tab-active-rf {
          background: #4f46e5 !important;
          color: #ffffff !important;
          border: 1px solid #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .upload-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 380px;
          border: 2px dashed rgba(30, 58, 138, 0.2);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(10px);
          cursor: pointer;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .upload-card:hover {
          border-color: #1e3a8a;
          background: rgba(30, 58, 138, 0.02);
          box-shadow: 0 8px 30px rgba(30, 58, 138, 0.05);
        }
        .upload-icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: rgba(30, 58, 138, 0.06);
          border: 1px solid rgba(30, 58, 138, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e3a8a;
          margin-bottom: 1.25rem;
          transition: all 0.3s ease;
        }
        .upload-card:hover .upload-icon-wrapper {
          transform: translateY(-5px) scale(1.05);
          background: rgba(30, 58, 138, 0.12);
          box-shadow: 0 0 20px rgba(30, 58, 138, 0.15);
        }
        .upload-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }
        .upload-desc {
          font-size: 0.85rem;
          color: #64748b;
          text-align: center;
          max-width: 280px;
        }
        .preview-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          overflow: hidden;
        }
        .preview-image {
          max-width: 100%;
          max-height: 480px;
          width: auto;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .skeleton-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .skeleton-line {
          stroke: #10b981;
          stroke-width: 4.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7));
          opacity: 0.85;
        }
        .skeleton-line-arm {
          stroke: #00f2fe;
          stroke-width: 4.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.8));
          opacity: 0.9;
        }
        .skeleton-line-torso {
          stroke: #ff007f;
          stroke-width: 5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 10px rgba(255, 0, 127, 0.8));
          opacity: 0.95;
        }
        .skeleton-line-leg {
          stroke: #bd00ff;
          stroke-width: 4.5;
          stroke-linecap: round;
          filter: drop-shadow(0 0 8px rgba(189, 0, 255, 0.7));
          opacity: 0.85;
        }
        .skeleton-line-face {
          stroke: transparent;
          stroke-width: 0;
          opacity: 0;
        }
        .skeleton-joint {
          fill: #00f2fe;
          stroke: #fff;
          stroke-width: 1.5;
          r: 4;
          filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.8));
          transition: all 0.2s ease;
        }
        .skeleton-joint-critical {
          fill: #ff0055;
          stroke: #fff;
          stroke-width: 2;
          r: 5.5;
          filter: drop-shadow(0 0 8px rgba(255, 0, 85, 0.9));
        }
        .skeleton-joint-leg {
          fill: #bd00ff;
          stroke: #fff;
          stroke-width: 1.5;
          r: 4;
          filter: drop-shadow(0 0 5px rgba(189, 0, 255, 0.8));
        }
        .skeleton-joint-arm {
          fill: #00f2fe;
          stroke: #fff;
          stroke-width: 1.5;
          r: 4;
          filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.8));
        }
        .result-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          text-align: center;
        }
        .confidence-circle-container {
          position: relative;
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .circle-bg {
          fill: none;
          stroke: rgba(0, 0, 0, 0.05);
          stroke-width: 8;
        }
        .circle-progress {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dashoffset 0.6s ease;
        }
        .confidence-value {
          position: absolute;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e3a8a;
        }
        .gesture-badge {
          padding: 0.6rem 1.25rem;
          border-radius: 100px;
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: 0.95rem;
          text-transform: uppercase;
        }
        .badge-ahead {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.05);
        }
        .badge-turn {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.25);
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.05);
        }
        .badge-stop {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.05);
        }
        .badge-none {
          background: rgba(156, 163, 175, 0.1);
          color: #64748b;
          border: 1px solid rgba(156, 163, 175, 0.2);
        }
        .gesture-details {
          background: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          padding: 1rem;
          text-align: left;
          width: 100%;
        }
        .detail-title {
          font-size: 0.85rem;
          color: #1e3a8a;
          margin-bottom: 0.35rem;
          font-weight: 700;
        }
        .detail-desc {
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.45;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          width: 100%;
        }
        .metric-item {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 10px;
          padding: 0.75rem;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }
        .metric-val {
          font-size: 1rem;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 0.15rem;
        }
        .processing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          z-index: 20;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(30, 58, 138, 0.1);
          border-radius: 50%;
          border-top-color: #1e3a8a;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* CỘT TRÁI: UPLOAD VÀ PREVIEW ẢNH / VIDEO */}
      <section className="left-col">
        <div className="model-selector-bar">
          <button
            className={`model-tab ${selectedModel === 'dnn' ? 'model-tab-active-dnn' : ''}`}
            onClick={() => changeModel('dnn')}
          >
            <Cpu size={16} />
            Mô hình DNN (Deep Learning)
          </button>
          <button
            className={`model-tab ${selectedModel === 'rf' ? 'model-tab-active-rf' : ''}`}
            onClick={() => changeModel('rf')}
          >
            <Sparkles size={16} />
            Mô hình Random Forest (RF)
          </button>
        </div>

        <div
          className="upload-card glass-panel"
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />

          {/* Đang phân tích xử lý AI (cho Ảnh) */}
          {isProcessing && (
            <div className="processing-overlay">
              <div className="spinner" />
              <div className="upload-title" style={{ animation: 'pulse 1.5s infinite' }}>Đang chạy tính toán AI...</div>
              <p className="upload-desc">Đang chạy MediaPipe Pose để trích xuất Khớp và đưa vào Mô hình {selectedModel.toUpperCase()}.</p>
            </div>
          )}

          {/* Chưa tải ảnh/video nào lên */}
          {!imagePreview && !videoPreview && (
            <>
              <div className="upload-icon-wrapper">
                <Upload size={32} />
              </div>
              <h3 className="upload-title">Tải lên Ảnh hoặc Video</h3>
              <p className="upload-desc">Kéo và thả tệp tin Ảnh hoặc Video của bạn vào đây, hoặc click để tìm kiếm file.</p>
            </>
          )}

          {/* CHẾ ĐỘ 1: XEM TRƯỚC VIDEO VÀ CHỒNG ĐÈ KHUNG XƯƠNG REAL-TIME */}
          {isVideoMode && videoPreview && (
            <div className="preview-wrapper" onClick={(e) => e.stopPropagation()}>
              <div style={{ position: 'relative', display: 'inline-flex', maxWidth: '100%', maxHeight: '480px', borderRadius: '12px', overflow: 'hidden' }}>
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="preview-image"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '480px', width: 'auto', height: 'auto', borderRadius: '12px' }}
                />

                {/* Vẽ khung xương SVG chồng lên video đang phát */}
                {(displayAllPoints || displayPoints) && (
                  <svg
                    className="skeleton-overlay"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    {displayAllPoints && displayAllPoints.length === 33 ? (
                      <>
                        {/* Render full 33-point skeleton */}
                        {POSE_CONNECTIONS.map(([start, end], idx) => {
                          const startPt = displayAllPoints[start];
                          const endPt = displayAllPoints[end];
                          if (!startPt || !endPt) return null;

                          let lineClass = 'skeleton-line';
                          if (start < 11 && end < 11) {
                            lineClass = 'skeleton-line-face';
                          } else if (start >= 23 || end >= 23) {
                            lineClass = 'skeleton-line-leg';
                          } else if (
                            ((start === 11 && end === 12) || (start === 23 && end === 24) ||
                             (start === 11 && end === 23) || (start === 12 && end === 24))
                          ) {
                            lineClass = 'skeleton-line-torso';
                          } else {
                            lineClass = 'skeleton-line-arm';
                          }

                          return (
                            <line
                              key={`full-line-${idx}`}
                              x1={startPt.cx}
                              y1={startPt.cy}
                              x2={endPt.cx}
                              y2={endPt.cy}
                              className={lineClass}
                            />
                          );
                        })}
                        {displayAllPoints.map((pt: any, idx: number) => {
                          if (idx < 11) return null; // Giải phóng khuôn mặt, ẩn toàn bộ khớp mặt rối mắt

                          let jointClass = 'skeleton-joint';
                          if (idx === 15 || idx === 16) {
                            jointClass = 'skeleton-joint-critical';
                          } else if (idx >= 23) {
                            jointClass = 'skeleton-joint-leg';
                          } else {
                            jointClass = 'skeleton-joint-arm';
                          }

                          return (
                            <circle
                              key={`full-joint-${idx}`}
                              cx={pt.cx}
                              cy={pt.cy}
                              className={jointClass}
                            />
                          );
                        })}
                      </>
                    ) : displayPoints ? (
                      <>
                        {/* Fallback to original 9-point skeleton */}
                        <line x1={displayPoints.lShoulder.cx} y1={displayPoints.lShoulder.cy} x2={displayPoints.rShoulder.cx} y2={displayPoints.rShoulder.cy} className="skeleton-line" />
                        <line x1={displayPoints.lShoulder.cx} y1={displayPoints.lShoulder.cy} x2={displayPoints.lElbow.cx} y2={displayPoints.lElbow.cy} className="skeleton-line" />
                        <line x1={displayPoints.rShoulder.cx} y1={displayPoints.rShoulder.cy} x2={displayPoints.rElbow.cx} y2={displayPoints.rElbow.cy} className="skeleton-line" />
                        <line x1={displayPoints.lElbow.cx} y1={displayPoints.lElbow.cy} x2={displayPoints.lWrist.cx} y2={displayPoints.lWrist.cy} className="skeleton-line" />
                        <line x1={displayPoints.rElbow.cx} y1={displayPoints.rElbow.cy} x2={displayPoints.rWrist.cx} y2={displayPoints.rWrist.cy} className="skeleton-line" />
                        <line x1={displayPoints.neck.cx} y1={displayPoints.neck.cy} x2={displayPoints.pelvis.cx} y2={displayPoints.pelvis.cy} className="skeleton-line" />

                        <circle cx={displayPoints.head.cx} cy={displayPoints.head.cy} className="skeleton-joint" style={{ r: 7 }} />
                        <circle cx={displayPoints.neck.cx} cy={displayPoints.neck.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.pelvis.cx} cy={displayPoints.pelvis.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lShoulder.cx} cy={displayPoints.lShoulder.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.rShoulder.cx} cy={displayPoints.rShoulder.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lElbow.cx} cy={displayPoints.lElbow.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.rElbow.cx} cy={displayPoints.rElbow.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lWrist.cx} cy={displayPoints.lWrist.cy} className="skeleton-joint" style={{ fill: '#3b82f6' }} />
                        <circle cx={displayPoints.rWrist.cx} cy={displayPoints.rWrist.cy} className="skeleton-joint" style={{ fill: '#3b82f6' }} />
                      </>
                    ) : null}
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* CHẾ ĐỘ 2: XEM TRƯỚC ẢNH VÀ CHỒNG ĐÈ KHUNG XƯƠNG */}
          {!isVideoMode && imagePreview && (
            <div className="preview-wrapper">
              <div style={{ position: 'relative', display: 'inline-flex', maxWidth: '100%', maxHeight: '480px', borderRadius: '12px', overflow: 'hidden' }}>
                <img
                  src={imagePreview}
                  alt="Uploaded gesture preview"
                  className="preview-image"
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '480px', width: 'auto', height: 'auto', borderRadius: '12px' }}
                />

                {/* Vẽ khung xương SVG chồng lên ảnh khớp 100% */}
                {(displayAllPoints || displayPoints) && (
                  <svg
                    className="skeleton-overlay"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}
                  >
                    {displayAllPoints && displayAllPoints.length === 33 ? (
                      <>
                        {/* Render full 33-point skeleton */}
                        {POSE_CONNECTIONS.map(([start, end], idx) => {
                          const startPt = displayAllPoints[start];
                          const endPt = displayAllPoints[end];
                          if (!startPt || !endPt) return null;

                          let lineClass = 'skeleton-line';
                          if (start < 11 && end < 11) {
                            lineClass = 'skeleton-line-face';
                          } else if (start >= 23 || end >= 23) {
                            lineClass = 'skeleton-line-leg';
                          } else if (
                            ((start === 11 && end === 12) || (start === 23 && end === 24) ||
                             (start === 11 && end === 23) || (start === 12 && end === 24))
                          ) {
                            lineClass = 'skeleton-line-torso';
                          } else {
                            lineClass = 'skeleton-line-arm';
                          }

                          return (
                            <line
                              key={`full-line-${idx}`}
                              x1={startPt.cx}
                              y1={startPt.cy}
                              x2={endPt.cx}
                              y2={endPt.cy}
                              className={lineClass}
                            />
                          );
                        })}
                        {displayAllPoints.map((pt: any, idx: number) => {
                          if (idx < 11) return null; // Giải phóng khuôn mặt, ẩn toàn bộ khớp mặt rối mắt

                          let jointClass = 'skeleton-joint';
                          if (idx === 15 || idx === 16) {
                            jointClass = 'skeleton-joint-critical';
                          } else if (idx >= 23) {
                            jointClass = 'skeleton-joint-leg';
                          } else {
                            jointClass = 'skeleton-joint-arm';
                          }

                          return (
                            <circle
                              key={`full-joint-${idx}`}
                              cx={pt.cx}
                              cy={pt.cy}
                              className={jointClass}
                            />
                          );
                        })}
                      </>
                    ) : displayPoints ? (
                      <>
                        {/* Fallback to original 9-point skeleton */}
                        <line x1={displayPoints.lShoulder.cx} y1={displayPoints.lShoulder.cy} x2={displayPoints.rShoulder.cx} y2={displayPoints.rShoulder.cy} className="skeleton-line" />
                        <line x1={displayPoints.lShoulder.cx} y1={displayPoints.lShoulder.cy} x2={displayPoints.lElbow.cx} y2={displayPoints.lElbow.cy} className="skeleton-line" />
                        <line x1={displayPoints.rShoulder.cx} y1={displayPoints.rShoulder.cy} x2={displayPoints.rElbow.cx} y2={displayPoints.rElbow.cy} className="skeleton-line" />
                        <line x1={displayPoints.lElbow.cx} y1={displayPoints.lElbow.cy} x2={displayPoints.lWrist.cx} y2={displayPoints.lWrist.cy} className="skeleton-line" />
                        <line x1={displayPoints.rElbow.cx} y1={displayPoints.rElbow.cy} x2={displayPoints.rWrist.cx} y2={displayPoints.rWrist.cy} className="skeleton-line" />
                        <line x1={displayPoints.neck.cx} y1={displayPoints.neck.cy} x2={displayPoints.pelvis.cx} y2={displayPoints.pelvis.cy} className="skeleton-line" />

                        <circle cx={displayPoints.head.cx} cy={displayPoints.head.cy} className="skeleton-joint" style={{ r: 7 }} />
                        <circle cx={displayPoints.neck.cx} cy={displayPoints.neck.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.pelvis.cx} cy={displayPoints.pelvis.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lShoulder.cx} cy={displayPoints.lShoulder.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.rShoulder.cx} cy={displayPoints.rShoulder.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lElbow.cx} cy={displayPoints.lElbow.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.rElbow.cx} cy={displayPoints.rElbow.cy} className="skeleton-joint" />
                        <circle cx={displayPoints.lWrist.cx} cy={displayPoints.lWrist.cy} className="skeleton-joint" style={{ fill: '#3b82f6' }} />
                        <circle cx={displayPoints.rWrist.cx} cy={displayPoints.rWrist.cy} className="skeleton-joint" style={{ fill: '#3b82f6' }} />
                      </>
                    ) : null}
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI */}
      <section className="right-col">
        <div className="glass-panel result-card" style={{ flex: 1 }}>
          <div className="panel-header" style={{ width: '100%', padding: '0 0 1rem 0' }}>
            <h2 className="panel-title">Kết quả Nhận diện AI</h2>
            <p className="panel-subtitle">Chỉ số phản hồi trực tiếp từ bộ lọc mô hình</p>
          </div>

          {!result ? (
            <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>
              <ImageIcon size={48} style={{ opacity: 0.15, marginBottom: '0.75rem', marginLeft: 'auto', marginRight: 'auto' }} />
              <p style={{ fontSize: '0.85rem' }}>Vui lòng chọn hoặc thả Ảnh / Video để bắt đầu nhận diện cử chỉ.</p>
            </div>
          ) : (
            <>
              {/* Vòng tròn phần trăm Độ Tin Cậy */}
              <div className="confidence-circle-container">
                <svg width="130" height="130">
                  <circle cx="65" cy="65" r="54" className="circle-bg" />
                  <circle
                    cx="65"
                    cy="65"
                    r="54"
                    className="circle-progress"
                    stroke={selectedModel === 'dnn' ? '#6366f1' : '#fbbf24'}
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - result.confidence)}
                  />
                </svg>
                <div className="confidence-value">
                  {Math.round(result.confidence * 100)}%
                </div>
              </div>

              {/* Badge cử chỉ */}
              <div className={`gesture-badge ${result.label === 'AHEAD' ? 'badge-ahead' : (result.label === 'STOP' ? 'badge-stop' : (result.label === 'NONE' ? 'badge-none' : 'badge-turn'))
                }`}>
                {getGestureNameVi(result.label)}
              </div>

              {/* Thông số kỹ thuật mô hình */}
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-val">{selectedModel.toUpperCase()}</div>
                  <div className="panel-subtitle" style={{ fontSize: '0.75rem' }}>Bộ phân loại</div>
                </div>
                <div className="metric-item">
                  <div className="metric-val" style={{ color: result.points ? '#10b981' : '#ef4444' }}>
                    {result.points ? 'Đã dựng' : 'Không có'}
                  </div>
                  <div className="panel-subtitle" style={{ fontSize: '0.75rem' }}>Khung xương</div>
                </div>
              </div>

              {/* Chi tiết hành động điều phối */}
              <div className="gesture-details">
                <h4 className="detail-title">Mô tả nghiệp vụ sân đỗ:</h4>
                <p className="detail-desc">{getGestureDescVi(result.label)}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', color: '#10b981', fontSize: '0.8rem' }}>
                <CheckCircle2 size={14} />
                <span>Hoàn tất xử lý cử chỉ {isVideoMode ? 'Video' : 'Ảnh'}</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};
