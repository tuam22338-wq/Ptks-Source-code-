import React from 'react';
import { FaTimes, FaBell } from 'react-icons/fa';
import { CURRENT_GAME_VERSION } from '../../constants';

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
                    <h2 className="text-3xl font-bold font-title text-center text-amber-300">Cập nhật phiên bản {CURRENT_GAME_VERSION}</h2>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu quay trở lại!</p>
                    <p>Phiên bản {CURRENT_GAME_VERSION} - "Vật Lộn Sinh Tồn" đã được cập nhật với các thay đổi lớn sau:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>
                            <strong className="text-amber-300">Hệ Thống Sinh Tồn (Vitals):</strong> 
                            Giới thiệu cơ chế mới về <strong className="text-yellow-400">Đói</strong>, <strong className="text-blue-400">Khát</strong> và <strong className="text-red-400">Nhiệt độ</strong>. Giờ đây, bạn cần phải ăn uống và chú ý đến môi trường để tồn tại trong thế giới tu tiên khắc nghiệt.
                        </li>
                        <li>
                            <strong className="text-amber-300">Giao diện "Hệ Thống" mới:</strong> 
                            Dành cho các Xuyên Việt Giả, bảng điều khiển "Hệ Thống" trong sidebar đã được làm lại hoàn toàn, tích hợp Cửa Hàng, Nhiệm Vụ và Trạng Thái vào một giao diện trực quan hơn.
                        </li>
                         <li>
                            <strong className="text-amber-300">Cải thiện AI tường thuật:</strong> 
                            AI kể chuyện giờ đây sẽ nhận biết và mô tả các trạng thái sinh tồn của bạn, làm cho trải nghiệm nhập vai trở nên sâu sắc hơn (ví dụ: mô tả cảm giác đói lả, lạnh cóng).
                        </li>
                        <li>
                            Sửa một số lỗi hiển thị và logic game để cải thiện trải nghiệm tổng thể.
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
