import React, { memo } from 'react';
import { FaBookReader, FaExclamationCircle, FaCoins, FaRoute, FaLandmark } from 'react-icons/fa';
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
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                    <FaBookReader className="text-amber-300" /> Hướng Dẫn Tương Tác AI
                </h3>
                <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm mb-4">
                    Nhiều tính năng của game đã được tích hợp vào AI kể chuyện để mang lại trải nghiệm nhập vai sâu sắc hơn. Hãy dùng ngôn ngữ tự nhiên để tương tác với thế giới!
                </div>
                <div className="space-y-4">
                    <GuideSection icon={FaRoute} title="Di Chuyển & Tương Tác">
                        <p>Các hành động cơ bản như di chuyển và nói chuyện giờ đây được thực hiện hoàn toàn bằng ngôn ngữ tự nhiên, thay vì nút bấm.</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li>Để di chuyển: "đi đến Triều Ca", "tới Rừng Cổ Thụ".</li>
                            <li>Để xem có ai xung quanh: "nhìn xung quanh", "có ai ở đây không?".</li>
                            <li>Để nói chuyện: "nói chuyện với Khương Tử Nha", "bắt chuyện với lão nông".</li>
                            <li>Để khám phá: "khám phá khu rừng", "tìm kiếm xung quanh xem có gì không".</li>
                        </ul>
                        <p className="mt-2">AI sẽ tự động hiểu và tường thuật lại kết quả hành động của bạn.</p>
                    </GuideSection>

                    <GuideSection icon={GiSwapBag} title="Túi Đồ & Tiền Tệ">
                        <p>Bạn có thể mở túi đồ bất cứ lúc nào bằng cách ra lệnh:</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li>"mở túi đồ"</li>
                            <li>"kiểm tra hành trang"</li>
                        </ul>
                        <p className="mt-2">Tiền tệ (Bạc, Linh Thạch,...) được coi như vật phẩm và nằm trong túi đồ của bạn.</p>
                        <p>Sau khi bạn trang bị, sử dụng hoặc vứt bỏ vật phẩm và đóng túi đồ lại, AI kể chuyện sẽ tự động nhận biết và tiếp nối câu chuyện một cách hợp lý.</p>
                    </GuideSection>
                    
                     <GuideSection icon={GiCastle} title="Công Pháp & Tu Luyện">
                        <p>Tu luyện là con đường hấp thụ linh khí để tăng cường tu vi. Ban đầu, bạn có thể học các <strong className="text-yellow-300">Công Pháp Phụ Đạo</strong> từ sư phụ hoặc kỳ ngộ để bắt đầu tích lũy linh khí.</p>
                        <p>Tuy nhiên, để thực sự phát triển và có sức chiến đấu, bạn cần tìm và tu luyện một <strong className="text-amber-300">Công Pháp Chủ Đạo</strong>. Công pháp chủ đạo sẽ mở khóa cây kỹ năng, mang lại các thần thông mạnh mẽ và định hình con đường tu luyện của bạn.</p>
                        <p className="mt-2">Không có công pháp chủ đạo, bạn sẽ rất thiệt thòi khi đối đầu với tu sĩ cùng cấp.</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li>Dùng lệnh "tu luyện" để hấp thụ linh khí.</li>
                            <li>Tìm kiếm sư phụ hoặc bí cảnh để có được công pháp.</li>
                        </ul>
                    </GuideSection>

                     <GuideSection icon={GiGears} title="Các Hành Động Hệ Thống">
                        <p>Các hành động phức tạp hơn cũng được điều khiển bằng lời nói:</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li><strong className="text-gray-300">Tông Môn (<FaLandmark className="inline-block mb-1"/>):</strong> "tìm một tông môn để gia nhập", "xin gia nhập Xiển Giáo".</li>
                            <li><strong className="text-gray-300">Động Phủ (<GiMountainCave className="inline-block mb-1"/>):</strong> "nâng cấp Tụ Linh Trận", "cải thiện Linh Điền".</li>
                            <li><strong className="text-gray-300">Luyện Đan (<GiCauldron className="inline-block mb-1"/>):</strong> "bắt đầu luyện đan", "luyện chế Hồi Khí Đan". AI sẽ tự kiểm tra xem bạn có đan phương, nguyên liệu, và đan lô hay không.</li>
                        </ul>
                    </GuideSection>

                    <div className="p-3 text-center bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm">
                        <FaExclamationCircle className="inline-block mr-2" />
                        Hãy sáng tạo! AI có thể hiểu nhiều cách diễn đạt khác nhau.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(GuidePanel);