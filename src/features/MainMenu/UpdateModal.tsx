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
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Vạn Vật Quy Nhất</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu đến với một phiên bản được tái cấu trúc lớn, đặt nền móng cho một tương lai không giới hạn:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">Đại Tái Cấu Trúc Mã Nguồn (Lõi)</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Toàn bộ mã nguồn đã được tái cấu trúc. Các dữ liệu thế giới cứng (Phong Thần, Tây Du) đã được loại bỏ khỏi mã nguồn chính. Điều này giúp game thực sự trở thành một nền tảng, sẵn sàng cho bất kỳ thế giới mod nào mà không cần sửa đổi mã nguồn.
                            </p>
                        </li>
                        <li>
                            <strong className="text-amber-300">Dọn Dẹp Triệt Để</strong>
                             <p className="text-sm text-gray-400 pl-2">
                                Hàng chục tệp tin và thành phần mã nguồn không còn được sử dụng, đã lỗi thời, hoặc rỗng đã bị xóa khỏi dự án. Điều này giúp mã nguồn gọn gàng hơn, dễ bảo trì và phát triển trong tương lai, đồng thời cải thiện một chút hiệu suất tải game.
                            </p>
                        </li>
                         <li>
                            <strong className="text-amber-300">Luồng Game Thống Nhất</strong>
                            <p className="text-sm text-gray-400 pl-2">
                                Luồng game cũ với việc chọn nhân vật và thế giới riêng biệt đã bị loại bỏ. Giờ đây, mọi hành trình đều bắt đầu từ "Tạo Thế Giới Mới", nơi người chơi và AI cùng nhau kiến tạo nên vũ trụ của riêng mình.
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