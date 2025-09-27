

import React from 'react';
import { FaTimes, FaBell } from 'react-icons/fa';
import { CURRENT_GAME_VERSION } from '../../constants';

interface UpdateModalProps {
    onClose: () => void;
    onDismissPermanently: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose, onDismissPermanently }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-2xl m-4 p-6 flex flex-col relative">
                <div className="text-center mb-4">
                    <FaBell className="text-4xl text-amber-300 mx-auto mb-2" />
                    <h2 className="text-3xl font-bold font-title text-center text-amber-300">Cập nhật phiên bản {CURRENT_GAME_VERSION}</h2>
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Thiên Cơ Vận Chuyển</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu đã quay trở lại! Phiên bản 1.1.0 "Thiên Cơ Vận Chuyển" mang đến những thay đổi đột phá, biến thế giới trở nên sống động và có chiều sâu hơn bao giờ hết:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">"Thiên Cơ Vận Chuyển" - Mô Phỏng Thế Giới Sống</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Giới thiệu hệ thống mô phỏng xã hội toàn diện. NPC giờ đây có ý chí, mục tiêu và kế hoạch riêng. Các thế lực sẽ tự tạo ra sự kiện động (chiến tranh, thiên tai...), và các mối quan hệ sẽ tự phát triển, làm cho thế giới luôn biến đổi và sống động.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Chế Độ Thử Nghiệm (Live Editor)</strong>
                             <p className="text-sm text-gray-400 pl-2">
                                Thêm một bảng điều khiển mới cho phép người dùng nâng cao chỉnh sửa trực tiếp chỉ số nhân vật, NPC, và các dữ liệu game khác ngay trong lúc chơi mà không cần tạo mod.
                            </p>
                        </li>
                         <li>
                            <strong className="text-amber-300">Tooltip Thông Tin NPC Động</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Khi AI kể chuyện tạo ra một nhân vật mới, tên của họ sẽ được tô sáng. Nhấp vào tên để xem ngay thông tin chi tiết về thuộc tính, cảnh giới, xuất thân... của họ.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Nâng Cấp Modding</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Thêm các hành động mặc định vào giao diện tạo mod để dễ dàng tùy biến. Hỗ trợ tạo và quản lý nhiều hệ thống tu luyện khác nhau trong cùng một bản mod.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Cải Tiến Nhỏ & Sửa Lỗi</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Hiển thị vị trí hiện tại trên thanh timeline, nâng cấp AI kể chuyện để linh hoạt hơn với nhiều thể loại, và sửa nhiều lỗi nhỏ để cải thiện sự ổn định.
                            </p>
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
                        className="w-full sm:w-auto px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 font-bold rounded-lg"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;