

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
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Linh Hoạt Thế Giới</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu! Phiên bản 1.1.1 "Linh Hoạt Thế Giới" tập trung vào việc trao cho bạn nhiều quyền kiểm soát hơn đối với vũ trụ của mình, cùng với các cải tiến chất lượng quan trọng:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">Nâng Cấp "Xuất Thế Giới"</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Chức năng xuất thế giới mặc định ("Phong Thần", "Tây Du") đã được đại tu. File mod xuất ra giờ đây chứa đựng đầy đủ và chi tiết hơn các dữ liệu gốc, bao gồm cả mối quan hệ và thiên phú của NPC, giúp việc tùy chỉnh và tái nhập vào game trở nên dễ dàng và mạnh mẽ hơn.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">"Thời Thế" Linh Động Theo Mod</strong>
                             <p className="text-sm text-gray-400 pl-2">
                                Màn hình "Thời Thế" (dòng lịch sử) đã được tái cấu trúc hoàn toàn. Hệ thống giờ đây sẽ ưu tiên tuyệt đối việc tải và hiển thị dòng lịch sử từ thế giới mod mà bạn đang kích hoạt, làm cho mỗi thế giới mod trở nên độc nhất và có chiều sâu hơn. Nếu không có, game sẽ tự động quay về lịch sử mặc định.
                            </p>
                        </li>
                         <li>
                            <strong className="text-amber-300">Cải Thiện Trải Nghiệm & Sửa Lỗi</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Tinh chỉnh lại logic tải dữ liệu và sửa một số lỗi nhỏ liên quan đến quản lý mod để đảm bảo trải nghiệm mượt mà và ổn định hơn.
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