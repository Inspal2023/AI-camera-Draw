import React from 'react';
import { COLORS } from '../constants';
import { EraserIcon, DownloadIcon, MagicIcon } from './Icons';

interface ToolbarProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClear: () => void;
  onDownload: () => void;
  onMagicClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentColor, onColorChange, onClear, onDownload, onMagicClick }) => {
  return (
    <div className="mt-6 p-3 bg-gray-800 rounded-full shadow-lg flex items-center justify-center space-x-2 md:space-x-4">
      <div className="flex items-center space-x-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-transform duration-200 transform hover:scale-110 ${
              currentColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          ></button>
        ))}
      </div>
      <div className="w-px h-8 bg-gray-600"></div>
      <button
        onClick={onClear}
        className="p-2 md:p-3 rounded-full bg-gray-700 hover:bg-red-500 text-white transition-colors"
        title="清除画布"
      >
        <EraserIcon />
      </button>
      <button
        onClick={onDownload}
        className="p-2 md:p-3 rounded-full bg-gray-700 hover:bg-blue-500 text-white transition-colors"
        title="下载作品"
      >
        <DownloadIcon />
      </button>
       <button
        onClick={onMagicClick}
        className="p-2 md:p-3 rounded-full bg-gray-700 hover:bg-purple-500 text-white transition-colors"
        title="AI 魔术"
      >
        <MagicIcon />
      </button>
    </div>
  );
};

export default Toolbar;