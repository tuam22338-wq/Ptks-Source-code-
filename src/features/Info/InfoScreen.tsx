import React, { memo } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { CURRENT_GAME_VERSION } from '../../constants';

const InfoScreen: React.FC = () => {
  const { handleNavigate } = useAppContext();

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-title">Thông Tin Trò Chơi</h2>
        <button
          onClick={() => handleNavigate('mainMenu')}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto pr-4 space-y-8">
        
        <section>
            <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">Thông Tin Phiên Bản</h3>
            <p className="text-gray-400">Phiên bản hiện tại: <strong className="text-amber-300">{CURRENT_GAME_VERSION}</strong></p>
        </section>

        <section>
            <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">Đội Ngũ Phát Triển</h3>
            <p className="text-gray-400">Developer: <strong className="text-amber-300">Nguyen Hoang Truong</strong></p>
            <p className="text-gray-400">Tester: <strong className="text-amber-300">NVH</strong></p>
            <p className="text-gray-400 mt-4">Xin chân thành cảm ơn bạn đã trải nghiệm sản phẩm này!</p>
        </section>

      </div>
    </div>
  );
};

export default memo(InfoScreen);
