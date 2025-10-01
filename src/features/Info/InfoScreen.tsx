

import React, { memo } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { CURRENT_GAME_VERSION } from '../../constants';

const InfoScreen: React.FC = () => {
  const { handleNavigate } = useAppContext();

  return (
    <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-title">Thông Tin Trò Chơi</h2>
        <button
          onClick={() => handleNavigate('mainMenu')}
          className="btn btn-neumorphic !rounded-full !p-2"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow min-h-0 overflow-y-auto pr-4 space-y-6">
        
        <div className="neumorphic-inset-box p-4">
            <h3 className="text-xl font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>Thông Tin Phiên Bản</h3>
            <p style={{color: 'var(--text-muted-color)'}}>Phiên bản hiện tại: <strong style={{color: 'var(--text-color)'}}>{CURRENT_GAME_VERSION}</strong></p>
        </div>

        <div className="neumorphic-inset-box p-4">
            <h3 className="text-xl font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>Đội Ngũ Phát Triển</h3>
            <p style={{color: 'var(--text-muted-color)'}}>Developer: <strong style={{color: 'var(--text-color)'}}>Nguyen Hoang Truong</strong></p>
            <p style={{color: 'var(--text-muted-color)'}}>Tester: <strong style={{color: 'var(--text-color)'}}>NVH</strong></p>
            <p className="mt-4" style={{color: 'var(--text-muted-color)'}}>Xin chân thành cảm ơn bạn đã trải nghiệm sản phẩm này!</p>
        </div>

        <div className="neumorphic-inset-box p-4">
            <h3 className="text-xl font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>Nền Tảng & Triển Khai</h3>
            <p style={{color: 'var(--text-muted-color)'}}>Trò chơi được xây dựng dưới dạng một ứng dụng web tĩnh và có thể được triển khai trên nhiều nền tảng hosting hiện đại.</p>
        </div>

      </div>
    </div>
  );
};

export default memo(InfoScreen);