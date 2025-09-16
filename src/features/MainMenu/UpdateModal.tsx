import React from 'react';
import { FaTimes, FaBell } from 'react-icons/fa';

interface UpdateModalProps {
    onClose: () => void;
    onDismissPermanently: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose, onDismissPermanently }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg m-4 p-6 flex flex-col relative">
                <div className="text-center mb-4">
                    <FaBell className="text-4xl text-amber-300 mx-auto mb-2" />
                    <h2 className="text-3xl font-bold font-title text-center text-amber-300">Cập nhật phiên bản 1.0.3</h2>
                </div>

                <div className="text-gray-300 space-y-3 my-4">
                    <p>Chào mừng quý đạo hữu quay trở lại!</p>
                    <p>Phiên bản 1.0.3 đã được cập nhật với các thay đổi sau:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>Sửa một số lỗi logic game và cải thiện hiệu năng.</li>
                        <li>
                            Thêm các tùy chọn AI chuyên biệt mới trong menu 
                            <strong className="text-amber-300"> Cài đặt &gt; AI & Models &gt; Phân Vai Model AI</strong>.
                            Điều này cho phép bạn tùy chỉnh sâu hơn các model cho từng tác vụ như phân tích hành động, chế tạo vật phẩm, v.v.
                        </li>
                    </ul>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onDismissPermanently}
                        className="w-full px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors text-sm"
                    >
                        Đã hiểu (Không hiển thị lại)
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2 themed-button-primary font-bold rounded-lg"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
