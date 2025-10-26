
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Hand, Keypoint } from '@tensorflow-models/hand-pose-detection';
import { GoogleGenAI, Modality } from '@google/genai';
import Toolbar from './components/Toolbar';
import { COLORS } from './constants';
import { DownloadIcon, LoadingSpinner, MagicIcon, SparklesIcon } from './components/Icons';

// TensorFlow.js and hand-pose-detection are loaded from CDN in index.html
// So we need to declare them to TypeScript
declare const tf: any;
declare const handPoseDetection: any;

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const PINCH_THRESHOLD = 40; // Distance between finger tips to trigger drawing

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const detectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('正在初始化...');
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [isPaused, setIsPaused] = useState(false);
  
  // AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [canvasPreview, setCanvasPreview] = useState<string>('');
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

  const lastPosition = useRef<{ x: number; y: number } | null>(null);

  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }, [currentColor]);

  const getDistance = (p1: Keypoint, p2: Keypoint): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };
  
  const detectHands = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
      animationFrameId.current = requestAnimationFrame(detectHands);
      return;
    }

    if (isPaused) {
      lastPosition.current = null; // Reset position when paused to avoid connecting points across pauses
      animationFrameId.current = requestAnimationFrame(detectHands);
      return;
    }
    
    const hands: Hand[] = await detectorRef.current.estimateHands(videoRef.current);

    if (hands.length > 0) {
      const indexTip = hands[0].keypoints[8];
      const thumbTip = hands[0].keypoints[4];

      const distance = getDistance(indexTip, thumbTip);
      const currentPosition = { x: indexTip.x, y: indexTip.y };
      
      if (distance < PINCH_THRESHOLD) {
        if (lastPosition.current) {
          drawLine(lastPosition.current, currentPosition);
        }
        lastPosition.current = currentPosition;
      } else {
        lastPosition.current = null;
      }
    } else {
      lastPosition.current = null;
    }
    
    animationFrameId.current = requestAnimationFrame(detectHands);
  }, [isPaused, drawLine]);

  const setup = useCallback(async () => {
    try {
      setLoadingMessage('正在准备摄像头...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }

      setLoadingMessage('正在加载手部检测模型...');
      await tf.setBackend('webgl');
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'full',
      };
      detectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);

      setLoadingMessage('准备就绪!');
      setIsLoading(false);
    } catch (error) {
      console.error("Initialization failed:", error);
      let errorMessage = '错误: 无法访问摄像头或加载模型。请检查权限并刷新。';
      if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
              errorMessage = '摄像头权限被拒绝。请在浏览器设置中允许摄像头访问，然后重试。';
          } else if (error.name === 'NotFoundError') {
              errorMessage = '未找到摄像头。请连接摄像头后重试。';
          }
      }
      setLoadingMessage(errorMessage);
    }
  }, []);

  useEffect(() => {
    if (sessionStarted) {
      setup();
    }

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionStarted, setup]);

  useEffect(() => {
    cancelAnimationFrame(animationFrameId.current);
    if (sessionStarted && !isLoading && detectorRef.current) {
      animationFrameId.current = requestAnimationFrame(detectHands);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [sessionStarted, isLoading, detectHands]);
  
  useEffect(() => {
    if (isAiModalOpen === false && sessionStarted && videoRef.current && streamRef.current) {
        if (videoRef.current.srcObject !== streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }
  }, [isAiModalOpen, sessionStarted]);

  const handleStart = () => {
    setSessionStarted(true);
    setIsLoading(true);
  };
  
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'sky-painting.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleMagicClick = () => {
    if (canvasRef.current) {
        setIsPaused(true);
        setAiGeneratedImage(null); // Ensure we start in prompt mode
        setCanvasPreview(canvasRef.current.toDataURL('image/png'));
        setIsAiModalOpen(true);
    }
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    setAiPrompt('');
    setIsGenerating(false);
    setAiError(null);
    setAiGeneratedImage(null);
    setCanvasPreview('');
    setIsPaused(false);
  };

  const handleGenerateImage = async (promptOverride?: string) => {
    const userPrompt = promptOverride ?? aiPrompt;
    if (!promptOverride && !userPrompt.trim()) {
      setAiError('请输入提示词。');
      return;
    }
    if (!canvasRef.current) return;

    setIsGenerating(true);
    setAiError(null);
    
    const finalPrompt = `将这张草图变成一幅精美的艺术作品：“${userPrompt}”。不要在最终图像中显示原始的草图线条。`;

    try {
        if (!process.env.API_KEY) {
          throw new Error("API 密钥未配置。");
        }
      
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imageB64 = canvasRef.current.toDataURL('image/png').split(',')[1];
        const imagePart = { inlineData: { data: imageB64, mimeType: 'image/png' } };
        const textPart = { text: finalPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const imagePartFound = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (imagePartFound?.inlineData) {
            const base64ImageBytes = imagePartFound.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            setAiGeneratedImage(imageUrl);
        } else {
            const textResponse = response.text;
            if (textResponse) {
              throw new Error(`AI 返回了文本信息，而不是图片： ${textResponse}`);
            } else {
              throw new Error('AI未能生成有效的图片。请检查您的输入或稍后再试。');
            }
        }
    } catch (error) {
        console.error('AI generation failed:', error);
        setAiError(error instanceof Error ? error.message : '生成失败，请稍后再试。');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownloadAiImage = () => {
    if (aiGeneratedImage) {
        const link = document.createElement('a');
        link.download = 'ai-sky-painting.png';
        link.href = aiGeneratedImage;
        link.click();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
      <h1 className="text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        空中画笔
      </h1>
      <div className="relative w-full max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden border-2 border-purple-500 aspect-[4/3]">
        {!sessionStarted ? (
            <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-3xl font-bold mb-4">欢迎来到空中画笔!</h2>
                <p className="text-lg mb-8 max-w-md">用您的手在空中作画。捏合拇指和食指即可开始在画布上绘画。</p>
                <button 
                    onClick={handleStart}
                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-purple-700 shadow-lg"
                >
                    开始绘画
                </button>
            </div>
        ) : (
            <>
                {isLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg">{loadingMessage}</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  width={VIDEO_WIDTH}
                  height={VIDEO_HEIGHT}
                  autoPlay
                  playsInline
                  muted
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                ></video>
                <canvas
                  ref={canvasRef}
                  width={VIDEO_WIDTH}
                  height={VIDEO_HEIGHT}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ transform: 'scaleX(-1)' }}
                ></canvas>
            </>
        )}
      </div>
      {sessionStarted && !isLoading && (
        <Toolbar
          currentColor={currentColor}
          onColorChange={setCurrentColor}
          onClear={handleClear}
          onDownload={handleDownload}
          onMagicClick={handleMagicClick}
        />
      )}
      {isAiModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-30 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl relative animate-fade-in-up">
                
                {aiGeneratedImage ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-center text-green-400">生成成功！</h2>
                        <div className="relative mb-4 rounded-md overflow-hidden border-2 border-gray-600">
                           <img src={aiGeneratedImage} alt="AI generated art" className="w-full h-auto object-contain"/>
                           <div className="absolute bottom-4 right-4 w-1/4 max-w-[150px] rounded-md overflow-hidden border-2 border-white shadow-lg transition-transform hover:scale-110">
                                <img src={canvasPreview} alt="Original sketch" className="w-full h-auto" />
                                <p className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-xs text-center py-0.5">原始线稿</p>
                           </div>
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={handleCloseAiModal}
                                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg transition-colors hover:bg-gray-500"
                            >
                                返回绘画
                            </button>
                            <button
                                onClick={handleDownloadAiImage}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg transition-colors hover:bg-blue-700 flex items-center space-x-2"
                            >
                                <DownloadIcon />
                                <span>下载</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-center text-purple-400">AI 魔术绘图</h2>
                        
                        {aiError && (
                            <div className="bg-red-900 border border-red-500 text-white p-3 rounded-md mb-4 flex justify-between items-center text-sm">
                                <span className="break-all">{aiError}</span>
                                <button onClick={() => setAiError(null)} className="font-bold text-xl leading-none ml-4 flex-shrink-0">&times;</button>
                            </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/2">
                                <p className="text-sm text-gray-400 mb-2">您的画作:</p>
                                <img src={canvasPreview} alt="Canvas preview" className="rounded-md border-2 border-gray-600"/>
                            </div>
                            <div className="w-full md:w-1/2 flex flex-col">
                                <p className="text-sm text-gray-400 mb-2">添加描述来改造它:</p>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="例如：一只在月球上吃奶酪的猫"
                                    className="w-full h-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows={4}
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={handleCloseAiModal}
                                disabled={isGenerating}
                                className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg transition-colors hover:bg-gray-500 disabled:opacity-50"
                            >
                                关闭
                            </button>
                            <button
                                onClick={() => handleGenerateImage("把这幅画变成令人惊叹的作品，发挥你的创造力。")}
                                disabled={isGenerating}
                                title="AI 自由想象"
                                className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                <SparklesIcon />
                                <span>自由想象</span>
                            </button>
                            <button
                                onClick={() => handleGenerateImage()}
                                disabled={isGenerating}
                                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]"
                            >
                                {isGenerating ? <LoadingSpinner className="h-5 w-5" /> : '生成'}
                            </button>
                        </div>
                        {isGenerating && (
                            <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex flex-col items-center justify-center">
                                <LoadingSpinner />
                                <p className="mt-4 text-lg">AI 正在创作中，请稍候...</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      )}
    </main>
  );
};

export default App;
