import React, { memo } from 'react';
import { FaArrowLeft, FaUserCog, FaListUl, FaBrain, FaDollarSign, FaUserClock, FaBookDead, FaWrench, FaFeatherAlt, FaPalette, FaProjectDiagram } from 'react-icons/fa';
import { GiCastle, GiMountainCave, GiCauldron } from 'react-icons/gi';

interface InfoScreenProps {
  onBack: () => void;
}

const FeatureItem: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 mt-1 flex-shrink-0 text-amber-300" />
        <div>
            <h4 className="font-bold text-gray-200">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);

const FEATURES = [
    { icon: FaBrain, title: 'Hệ Thống Thuộc Tính "Tinh - Khí - Thần"', description: 'Hệ thống thuộc tính sâu sắc dựa trên triết lý tu chân, bao gồm các chỉ số về Nhục Thân, Chân Nguyên, và Linh Hồn.' },
    { icon: FaDollarSign, title: 'Hệ Thống Kinh Tế & Tiền Tệ "Lưỡng Giới"', description: 'Phân chia tiền tệ thành Phàm Tệ (Đồng, Bạc, Vàng) và Linh Tệ (Linh Thạch) cho thế giới phàm nhân và tu chân.' },
    { icon: FaUserClock, title: 'NPC Có Tuổi Thọ', description: 'Các NPC trong game sẽ già đi và có thể qua đời, tạo ra một thế giới luôn biến đổi.' },
    { icon: FaProjectDiagram, title: 'Hệ Thống Tu Luyện & Công Pháp', description: 'Hệ thống cảnh giới chi tiết và cây kỹ năng cho công pháp chính, cùng với các công pháp phụ trợ.' },
    { icon: FaUserCog, title: 'Tạo Nhân Vật Bằng AI', description: 'Tạo ra thân phận, ngoại hình, và tiên tư độc nhất từ ý tưởng của người chơi hoặc nhập vai nhân vật có sẵn.' },
    { icon: GiCastle, title: 'Tông Môn & Động Phủ', description: 'Gia nhập tông môn như Xiển Giáo, Triệt Giáo, thực hiện nhiệm vụ, và xây dựng động phủ cá nhân.' },
    { icon: GiCauldron, title: 'Luyện Đan & Chế Tạo', description: 'Thu thập tài nguyên, học đan phương và luyện chế các loại đan dược hỗ trợ trên con đường tu tiên.' },
    { icon: FaWrench, title: 'Hệ Thống Mod Mở Rộng & Trình Chỉnh Sửa', description: 'Hỗ trợ tạo, quản lý và cài đặt mod từ cộng đồng với công cụ chỉnh sửa trực quan trong game.' },
    { icon: FaFeatherAlt, title: 'AI Game Master', description: 'AI đóng vai trò là "Thiên Đạo", tạo sự kiện, quản lý thế giới và phản ứng linh hoạt với hành động của người chơi.' },
    { icon: FaBookDead, title: 'Niên Biểu Lịch Sử (Thiên Mệnh)', description: 'Theo dõi các sự kiện trọng đại trong thế giới Phong Thần để nắm bắt dòng chảy câu chuyện.' },
    { icon: FaPalette, title: 'Giao Diện Tùy Biến Cao', description: 'Cho phép người chơi thay đổi font chữ, chủ đề màu sắc, ảnh nền, và nhiều yếu tố khác để cá nhân hóa trải nghiệm.' },
];

const InfoScreen: React.FC<InfoScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-title">Thông Tin Trò Chơi</h2>
        <button
          onClick={onBack}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto pr-4 space-y-8">
        
        <section>
            <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">Nhà Phát Triển</h3>
            <p className="text-gray-400">Trò chơi này được phát triển bởi <strong className="text-amber-300">Nguyen Hoang Truong (Daniel, Nobita)</strong>.</p>
            <p className="text-gray-400 mt-2">Xin chân thành cảm ơn bạn đã trải nghiệm sản phẩm này!</p>
        </section>

        <section>
            <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300 flex items-center gap-2"><FaListUl /> Tính Năng Cập Nhật 1.0.0</h3>
            <div className="space-y-4">
                {FEATURES.map(feature => <FeatureItem key={feature.title} {...feature} />)}
            </div>
        </section>

      </div>
    </div>
  );
};

export default memo(InfoScreen);