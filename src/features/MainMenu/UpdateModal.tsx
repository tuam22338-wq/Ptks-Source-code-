import React from 'react';
import { FaTimes, FaBell } from 'react-icons/fa';
import { CURRENT_GAME_VERSION } from '../../constants';

interface UpdateModalProps {
    onClose: () => void;
    onDismissPermanently: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose, onDismissPermanently }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
                <div className="modal-body">
                    <div className="text-center mb-4">
                        <FaBell className="text-4xl text-amber-300 mx-auto mb-2" />
                        <h2 className="text-3xl font-bold font-title text-center text-amber-300">Cập nhật phiên bản {CURRENT_GAME_VERSION}</h2>
                        <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Lưu Ly Chi Cảnh</p>
                    </div>

                    <div className="text-left text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                        <p>Phiên bản này mang đến một làn gió mới cho giao diện và trải nghiệm người dùng, tập trung vào sự tinh tế và hiệu suất.</p>
                        <ul className="list-disc list-inside space-y-3 pl-4">
                            <li>
                                <strong className="text-amber-300">Giao Diện Lưu Ly Ngọc Tinh</strong>
                                <p className="text-sm text-gray-400 pl-2">
                                    Giao diện mặc định của game đã được thay đổi thành "Lưu Ly Ngọc Tinh" (Glassmorphism), mang lại một trải nghiệm trong suốt, hiện đại và tinh tế hơn. Các thành phần giao diện giờ đây có hiệu ứng mờ ảo đẹp mắt.
                                </p>
                            </li>
                            <li>
                                <strong className="text-amber-300">Đồng bộ Theme Toàn diện</strong>
                                <p className="text-sm text-gray-400 pl-2">
                                    Bảng thông báo cập nhật và các cửa sổ khác đã được tái cấu trúc để hoàn toàn đồng bộ với theme người dùng đã chọn, đảm bảo tính nhất quán trên toàn bộ ứng dụng.
                                </p>
                            </li>
                             <li>
                                <strong className="text-amber-300">Tối ưu hóa Hiệu suất</strong>
                                <p className="text-sm text-gray-400 pl-2">
                                    Cải thiện hiệu suất tải game và các hiệu ứng hình ảnh, đảm bảo trải nghiệm mượt mà hơn trên nhiều thiết bị.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer flex-col sm:flex-row justify-between">
                    <button
                        onClick={onDismissPermanently}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors text-sm"
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