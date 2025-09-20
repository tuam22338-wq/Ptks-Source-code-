import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';

/**
 * Chứa logic render chính của ứng dụng.
 * Sẽ chỉ được gọi khi người dùng nhấn nút khởi động.
 */
function launchApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Lỗi: Không tìm thấy phần tử gốc 'root', ứng dụng không thể khởi chạy.");
    }
    
    // Hiển thị vùng chứa ứng dụng
    rootElement.style.display = 'block';

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

// --- Logic Khởi Động ---
// Đợi cho toàn bộ HTML được tải xong
window.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const launchContainer = document.getElementById('launch-container');

    if (startButton && launchContainer) {
        // Gán sự kiện click cho nút khởi động
        startButton.addEventListener('click', () => {
            // Ẩn màn hình chờ
            launchContainer.style.display = 'none';
            // Bắt đầu chạy ứng dụng React
            launchApp();
        }, { once: true }); // Sự kiện chỉ chạy một lần duy nhất
    } else {
        // Fallback: Nếu không tìm thấy nút, chạy ứng dụng ngay lập tức
        // Điều này đảm bảo ứng dụng vẫn hoạt động bình thường khi chạy bên ngoài AI Studio
        console.warn("Không tìm thấy nút khởi động, ứng dụng sẽ chạy ngay lập tức.");
        launchApp();
    }
});