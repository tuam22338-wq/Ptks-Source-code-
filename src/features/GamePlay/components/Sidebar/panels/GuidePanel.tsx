import React, { memo } from 'react';
import { FaBookReader, FaExclamationCircle, FaRoute, FaLandmark, FaBars, FaRegWindowMaximize } from 'react-icons/fa';
import { GiSwapBag, GiGears, GiCauldron, GiMountainCave, GiCastle } from 'react-icons/gi';

const GuideSection: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="flex items-center gap-2 font-bold text-amber-300 font-title">
            <Icon className="w-5 h-5" />
            {title}
        </h4>
        <div className="mt-2 text-sm text-gray-300 space-y-2 pl-4 border-l-2 border-gray-600/50 ml-2">
            {children}
        </div>
    </div>
);

const GuidePanel: React.FC = () => {
    return (
        <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <h3 className="flex items-center justify-center gap-2 text-lg text-gray-300 font-title font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                <FaBookReader className="text-amber-300" /> Hướng Dẫn Nhanh
            </h3>

            <GuideSection icon={GiGears} title="Sử Dụng Giao Diện">
                <p>Các bảng thông tin và chức năng chính có thể được truy cập như sau:</p>
                <ul className="list-disc list-inside text-gray-400 italic">
                    <li><strong className="text-gray-300">Bảng Điều Khiển:</strong> Mở bảng điều khiển chính (Trạng Thái, Bản Đồ, Nhiệm Vụ, v.v.) qua nút trên thanh hành động.</li>
                    <li><strong className="text-gray-300">Túi Đồ (<GiSwapBag className="inline-block mb-1"/>):</strong> Gõ lệnh "mở túi đồ" hoặc nhấn nút nhanh để mở túi đồ của bạn.</li>
                    <li><strong className="text-gray-300">Hỏi Thiên Cơ:</strong> Sử dụng tab "Hỏi Thiên Cơ" trong ô hành động để hỏi AI về các thông tin trong game.</li>
                </ul>
            </GuideSection>
            
            <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm">
                Nhiều tính năng của game đã được tích hợp vào AI. Hãy dùng ngôn ngữ tự nhiên để tương tác với thế giới!
            </div>

            <GuideSection icon={FaRoute} title="Tương Tác AI & Ngôn Ngữ Tự Nhiên">
                <p>Các hành động cơ bản như di chuyển và nói chuyện giờ đây được thực hiện hoàn toàn bằng ngôn ngữ tự nhiên.</p>
                <ul className="list-disc list-inside text-gray-400 italic">
                    <li>Để di chuyển: "đi đến Triều Ca", "tới Rừng Cổ Thụ".</li>
                    <li>Để xem xung quanh: "nhìn xung quanh", "có ai ở đây không?".</li>
                    <li>Để nói chuyện: "nói chuyện với Khương Tử Nha", "bắt chuyện với lão nông".</li>
                    <li>Để khám phá: "khám phá khu rừng", "tìm kiếm vật phẩm".</li>
                </ul>
                <p className="mt-2">AI sẽ tự động hiểu và tường thuật lại kết quả hành động của bạn.</p>
            </GuideSection>
            
            <GuideSection icon={GiCastle} title="Phát Triển Sức Mạnh">
                <p>Phát triển sức mạnh là con đường hấp thụ năng lượng của thế giới (linh khí, nội lực, năng lượng psionic,...) để tăng cường bản thân. Ban đầu, bạn có thể học các <strong className="text-yellow-300">phương pháp cơ bản</strong> từ người hướng dẫn hoặc kỳ ngộ.</p>
                <p>Tuy nhiên, để thực sự mạnh mẽ, bạn cần tìm và đi theo một <strong className="text-amber-300">con đường sức mạnh chính</strong> (ví dụ: công pháp chủ đạo, cây kỹ năng, cấy ghép cybernetic...). Con đường này sẽ mở khóa các khả năng độc đáo và định hình phong cách chiến đấu của bạn.</p>
                <ul className="list-disc list-inside text-gray-400 italic mt-2">
                    <li>Dùng lệnh như "tu luyện", "thiền định", "hấp thụ năng lượng" để phát triển.</li>
                    <li>Tìm kiếm người hướng dẫn, bí cảnh, hoặc công nghệ để có được con đường sức mạnh cho riêng mình.</li>
                </ul>
            </GuideSection>

             <GuideSection icon={GiGears} title="Các Hành Động Hệ Thống">
                <p>Các hành động phức tạp hơn cũng được điều khiển bằng lời nói:</p>
                <ul className="list-disc list-inside text-gray-400 italic">
                    <li><strong className="text-gray-300">Gia nhập Phe phái (<FaLandmark className="inline-block mb-1"/>):</strong> "tìm một phe phái để gia nhập", "xin gia nhập Vệ Binh Tinh Hệ".</li>
                    <li><strong className="text-gray-300">Căn cứ (<GiMountainCave className="inline-block mb-1"/>):</strong> "nâng cấp phòng thí nghiệm", "cải thiện khu vườn", "xây dựng Tụ Linh Trận".</li>
                    <li><strong className="text-gray-300">Chế tạo (<GiCauldron className="inline-block mb-1"/>):</strong> "bắt đầu chế tạo", "tạo ra thuốc hồi phục", "luyện chế Hồi Khí Đan". AI sẽ tự kiểm tra xem bạn có bản thiết kế/đan phương, nguyên liệu, và công cụ hay không.</li>
                </ul>
            </GuideSection>

            <div className="p-3 text-center bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm">
                <FaExclamationCircle className="inline-block mr-2" />
                Hãy sáng tạo! AI có thể hiểu nhiều cách diễn đạt khác nhau.
            </div>
        </div>
    );
};

export default memo(GuidePanel);