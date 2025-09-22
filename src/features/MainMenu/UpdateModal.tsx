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
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl m-4 p-6 flex flex-col relative">
                <div className="text-center mb-4">
                    <FaBell className="text-4xl text-amber-300 mx-auto mb-2" />
                    <h2 className="text-3xl font-bold font-title text-center text-amber-300">Cập nhật phiên bản {CURRENT_GAME_VERSION}</h2>
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Sao Lưu & Nâng Cấp Hệ Thống</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu đã quay trở lại! Phiên bản này mang đến một tính năng quan trọng và các cải tiến hệ thống:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">Sao Lưu & Khôi Phục Dữ Liệu</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Thêm tính năng cho phép bạn sao lưu toàn bộ dữ liệu game (bao gồm các file lưu, cài đặt và mods) ra một tệp tin duy nhất. Bạn có thể sử dụng tệp này để chuyển dữ liệu sang thiết bị khác hoặc khôi phục lại khi cần. Tính năng này nằm trong `Cài Đặt > Nâng Cao`.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Tối ưu hóa và sửa lỗi</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Cải thiện hiệu suất chung và sửa một số lỗi nhỏ để mang lại trải nghiệm mượt mà hơn. Nâng cấp nền tảng để chuẩn bị cho các tính năng lớn sắp tới.
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
