import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Lỗi: Không tìm thấy phần tử gốc 'root', ứng dụng không thể khởi chạy.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
