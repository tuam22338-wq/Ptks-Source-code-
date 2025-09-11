import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-4 px-6">
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-200 font-title" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
        Phong Thần Ký Sự
      </h1>
      <h2 className="text-xl sm:text-2xl text-gray-400 mt-1 tracking-widest font-semibold font-title">
        Khởi Nguyên
      </h2>
    </header>
  );
};

export default Header;