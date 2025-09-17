import React, { memo } from 'react';
import { FaBookReader, FaExclamationCircle, FaCoins } from 'react-icons/fa';
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
                    <GuideSection icon={GiSwapBag} title="Túi Đồ & Tiền Tệ">
                        <p>Bạn có thể mở túi đồ bất cứ lúc nào bằng cách ra lệnh:</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li>"mở túi đồ"</li>
                            <li>"kiểm tra hành trang"</li>
                        </ul>
                        <p className="mt-2">Tiền tệ (Bạc, Linh Thạch,...) được coi như vật phẩm và nằm trong túi đồ của bạn.</p>
                        <p>Sau khi bạn trang bị, sử dụng hoặc vứt bỏ vật phẩm và đóng túi đồ lại, AI kể chuyện sẽ tự động nhận biết và tiếp nối câu chuyện một cách hợp lý.</p>
                    </GuideSection>
                    
                     <GuideSection icon={GiCastle} title="Bái Sư & Tu Luyện">
                        <p>Bạn không thể tu luyện nếu chưa có sư phụ. Hãy tìm một vị cao nhân và thể hiện thành ý để bái sư.</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li>"Ta muốn bái ngài làm sư phụ."</li>
                            <li>"Xin tiền bối hãy thu nhận ta làm đồ đệ."</li>
                        </ul>
                         <p className="mt-2">Một khi đã có sư phụ và công pháp, bạn có thể dùng lệnh "tu luyện" để tăng linh khí.</p>
                    </GuideSection>

                     <GuideSection icon={GiGears} title="Các Hành Động Khác">
                        <p>Các hành động phức tạp hơn cũng được điều khiển bằng lời nói:</p>
                        <ul className="list-disc list-inside text-gray-400 italic">
                            <li><strong className="text-gray-300">Nơi ở (<GiMountainCave className="inline-block mb-1"/>):</strong> "tìm một hang động để bế quan", "thuê một phòng ở quán trọ".</li>
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
