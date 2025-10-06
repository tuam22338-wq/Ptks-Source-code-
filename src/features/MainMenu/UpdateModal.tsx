import React from 'react';
import { FaBell } from 'react-icons/fa';
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
                        <FaBell className="text-4xl text-[var(--primary-accent-color)] mx-auto mb-2" />
                        <h2 className="text-3xl font-bold font-title text-center text-[var(--primary-accent-color)]">Cập nhật phiên bản {CURRENT_GAME_VERSION}</h2>
                        <p className="text-xl font-semibold font-title text-[var(--text-muted-color)] tracking-wider">Giao Diện Đồng Nhất</p>
                    </div>

                    <div className="text-[var(--text-color)] space-y-3 my-4 max-h-[50vh] overflow-y-auto pr-2">
                        <p>Chào mừng quý đạo hữu đến với phiên bản mới, tập trung vào việc thống nhất và cải thiện trải nghiệm giao diện người dùng:</p>
                        <ul className="list-disc list-inside space-y-3 pl-4">
                            <li>
                                <strong className="text-[var(--primary-accent-color)]">Đồng Bộ Giao Diện (UI Unification)</strong>
                                <p className="text-sm text-[var(--text-muted-color)] pl-2">
                                    Toàn bộ các cửa sổ pop-up trong game (Thông báo Cập nhật, Ủng hộ, Chọn ô lưu, v.v.) đã được thiết kế lại. Giờ đây, chúng đều tuân theo một phong cách nhất quán và hoàn toàn đồng bộ với "Chủ đề" (Theme) mà bạn đã chọn trong phần Cài Đặt.
                                </p>
                            </li>
                            <li>
                                <strong className="text-[var(--primary-accent-color)]">Cải Thiện Trải Nghiệm</strong>
                                 <p className="text-sm text-[var(--text-muted-color)] pl-2">
                                    Tinh chỉnh lại các nút bấm và màu sắc để mang lại một trải nghiệm người dùng mượt mà, dễ nhìn và chuyên nghiệp hơn trên toàn bộ ứng dụng.
                                </p>
                            </li>
                             <li>
                                <strong className="text-[var(--primary-accent-color)]">Tối Ưu Hóa & Sửa Lỗi</strong>
                                <p className="text-sm text-[var(--text-muted-color)] pl-2">
                                    Sửa một số lỗi nhỏ liên quan đến hiển thị và tối ưu hóa hiệu suất của các thành phần giao diện.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onDismissPermanently} className="btn btn-neumorphic">
                        Đã hiểu (Không hiển thị lại)
                    </button>
                    <button onClick={onClose} className="btn btn-primary">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;