

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
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Nâng Cấp Toàn Diện & Sửa Lỗi</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu đã quay trở lại! Phiên bản này mang đến những cải tiến lớn về logic AI và sửa các lỗi quan trọng:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">Cập nhật Link Discord</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Link mời tham gia cộng đồng Discord đã được cập nhật. Hãy tham gia để cùng thảo luận, báo lỗi và góp ý cho game!
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Sửa Lỗi Logic Game</strong>
                             <p className="text-sm text-gray-400 pl-2">
                                Khắc phục các lỗi quan trọng liên quan đến việc khởi tạo nhân vật, đảm bảo xuất thân và địa điểm bắt đầu của bạn được AI tôn trọng 100%.
                            </p>
                        </li>
                         <li>
                            <strong className="text-amber-300">Sửa Lỗi Túi Đồ (Toàn diện)</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Triển khai một giải pháp kiến trúc toàn diện ("Bộ Lọc Thiên Đạo") để khắc phục triệt để các lỗi tính toán và hiển thị trong túi đồ. Trải nghiệm quản lý vật phẩm của bạn giờ đây sẽ ổn định và chính xác hơn rất nhiều.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Nâng Cấp "Siêu Logic" AI (Hoàn thành)</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Hoàn thành việc nâng cấp hệ thống AI kể chuyện với "Trọng Tài AI", "Ký Ức Cá Nhân", "Ý Chí NPC" và "Dã Tâm Thế Lực", mang lại một thế giới nhất quán, logic và sống động hơn bao giờ hết.
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