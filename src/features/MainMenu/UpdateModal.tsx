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
                    <p className="text-xl font-semibold font-title text-gray-400 tracking-wider">Sáng Thế & Sinh Tồn</p>
                </div>

                <div className="text-gray-300 space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                    <p>Chào mừng quý đạo hữu! Phiên bản {CURRENT_GAME_VERSION} mang đến một cuộc cách mạng trong cách bạn tương tác và định hình thế giới, cùng những thử thách sinh tồn mới:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <strong className="text-amber-300">Xưởng Mod (Mod Studio) & Trợ lý AI:</strong>
                            <p className="text-sm text-gray-400 pl-2">Giới thiệu công cụ tạo mod toàn diện ngay trong game. Sử dụng Trợ lý AI để biến ý tưởng của bạn thành hiện thực! Giờ đây bạn có thể tự tạo:</p>
                            <ul className="list-circle list-inside pl-6 text-sm">
                                <li>Vật phẩm, Đan dược, Trang bị độc nhất.</li>
                                <li>Công pháp chủ đạo & phụ trợ với hệ thống kỹ năng phức tạp.</li>
                                <li>NPCs, Tông phái, Sự kiện, Bí cảnh...</li>
                                <li>Thậm chí là cả một <strong className="text-rose-400">Thế Giới (World)</strong> hoàn toàn mới với dòng thời gian và bối cảnh riêng!</li>
                            </ul>
                        </li>
                        <li>
                            <strong className="text-amber-300">Khai Tông Lập Phái:</strong> 
                            Khi đạt đến cảnh giới Kim Đan và có đủ danh vọng, bạn có thể tự mình sáng lập tông môn, chiêu mộ đệ tử, xây dựng thế lực của riêng mình.
                        </li>
                        <li>
                            <strong className="text-amber-300">Hệ Thống Sinh Tồn (Vitals):</strong> 
                            Thêm cơ chế mới về <strong className="text-yellow-400">Đói</strong>, <strong className="text-blue-400">Khát</strong> và <strong className="text-red-400">Nhiệt độ</strong>. Việc ăn uống và chú ý đến môi trường giờ là một phần thiết yếu trên con đường tu tiên.
                        </li>
                        <li>
                            <strong className="text-amber-300">Giao Diện Nâng Cấp:</strong>
                            <p className="text-sm text-gray-400 pl-2">Trải nghiệm game mượt mà hơn với:</p>
                             <ul className="list-circle list-inside pl-6 text-sm">
                                <li><strong className="text-lime-400">Bản Đồ</strong> trực quan mới, hiển thị các địa điểm và NPC.</li>
                                <li><strong className="text-cyan-400">Túi Đồ & Trang Bị</strong> được thiết kế lại hoàn toàn, trực quan và dễ sử dụng.</li>
                                <li>Bảng điều khiển <strong className="text-blue-400">"Hệ Thống"</strong> mới dành cho Xuyên Việt Giả.</li>
                            </ul>
                        </li>
                         <li>
                            Sửa một số lỗi và tối ưu hóa hiệu năng. Chúc quý đạo hữu có một hành trình tu tiên đầy sáng tạo và thử thách!
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
