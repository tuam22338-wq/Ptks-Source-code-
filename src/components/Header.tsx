import React, { memo } from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-4 px-6">
      <h1 className="text-4xl sm:text-5xl font-bold font-calligraphy" style={{color: 'var(--text-color)', textShadow: '-1px -1px 2px var(--shadow-light), 1px 1px 2px var(--shadow-dark)'}}>
        Tam Thiên Thế Giới
      </h1>
      <h2 className="text-xl sm:text-2xl mt-1 tracking-widest font-semibold font-title" style={{color: 'var(--text-muted-color)'}}>
        Khởi Nguyên
      </h2>
    </header>
  );
};

export default memo(Header);