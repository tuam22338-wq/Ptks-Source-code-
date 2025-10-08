import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';
import { getSettings } from './src/services/dbService';
import { DEFAULT_SETTINGS } from './src/constants';

/**
 * Chứa logic render chính của ứng dụng.
 * Sẽ chỉ được gọi khi người dùng nhấn nút khởi động.
 */
function launchApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Lỗi: Không tìm thấy phần tử gốc 'root', ứng dụng không thể khởi chạy.");
    }
    
    // Hiển thị vùng chứa ứng dụng bằng cách gỡ bỏ class `hidden`.
    // Điều này cho phép các class layout của Tailwind trong index.html được áp dụng.
    rootElement.classList.remove('hidden');

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

// --- Logic Khởi Động ---
// Đợi cho toàn bộ HTML được tải xong
window.addEventListener('DOMContentLoaded', async () => {
    // Tải và áp dụng cài đặt thu phóng trước khi hiển thị bất cứ thứ gì
    try {
        const settings = await getSettings();
        const zoomLevel = settings?.zoomLevel || DEFAULT_SETTINGS.zoomLevel;
        document.documentElement.style.fontSize = `${zoomLevel}%`;
    } catch (error: any) {
        console.error("Không thể tải cài đặt cho màn hình khởi động:", error);
        // Áp dụng thu phóng mặc định nếu có lỗi
        document.documentElement.style.fontSize = `${DEFAULT_SETTINGS.zoomLevel}%`;
    }

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
