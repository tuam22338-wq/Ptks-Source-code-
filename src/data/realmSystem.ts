import type { RealmConfig } from '../types';

export const REALM_SYSTEM: RealmConfig[] = [
    { 
        id: 'pham_nhan', name: 'Phàm Nhân', 
        description: 'Điểm khởi đầu của vạn vật, thân thể yếu đuối, chưa có linh lực, tuổi thọ hữu hạn.',
        stages: [
            { id: 'pn_1', name: '', qiRequired: 0, bonuses: [], description: 'Sinh mệnh bình thường, không có khả năng đặc biệt.' },
        ]
    },
    { 
        id: 'luyen_khi', name: 'Luyện Khí Kỳ',
        description: 'Bước đầu tiên trên con đường tu tiên, dẫn khí vào cơ thể, tẩy kinh phạt tủy. Mỗi tầng sẽ gia tăng một chút sức mạnh và thể chất.',
        stages: [
            { id: 'lk_1', name: 'Tầng 1', qiRequired: 100, bonuses: [{ attribute: 'Sinh Mệnh', value: 10 }, { attribute: 'Linh Lực', value: 5 }], description: 'Sơ bộ cảm nhận được linh khí.' },
            { id: 'lk_2', name: 'Tầng 2', qiRequired: 300, bonuses: [{ attribute: 'Sinh Mệnh', value: 10 }, { attribute: 'Linh Lực', value: 5 }], description: 'Có thể dẫn khí đi khắp châu thân.' },
            { id: 'lk_3', name: 'Tầng 3', qiRequired: 600, bonuses: [{ attribute: 'Sinh Mệnh', value: 10 }, { attribute: 'Linh Lực', value: 10 }], description: 'Linh lực trong cơ thể dần ổn định.' },
            { id: 'lk_4', name: 'Tầng 4', qiRequired: 1200, bonuses: [{ attribute: 'Sinh Mệnh', value: 15 }, { attribute: 'Linh Lực', value: 10 }], description: 'Sử dụng được một vài pháp thuật đơn giản.' },
            { id: 'lk_5', name: 'Tầng 5', qiRequired: 2500, bonuses: [{ attribute: 'Sinh Mệnh', value: 15 }, { attribute: 'Linh Lực', value: 15 }], description: 'Linh lực trở nên dồi dào hơn.' },
            { id: 'lk_6', name: 'Tầng 6', qiRequired: 5000, bonuses: [{ attribute: 'Sinh Mệnh', value: 15 }, { attribute: 'Linh Lực', value: 15 }], description: 'Điều khiển linh lực dần thành thục.' },
            { id: 'lk_7', name: 'Tầng 7', qiRequired: 10000, bonuses: [{ attribute: 'Sinh Mệnh', value: 20 }, { attribute: 'Linh Lực', value: 20 }], description: 'Linh lực bắt đầu ngưng tụ, có thể điều khiển pháp khí cấp thấp.' },
            { id: 'lk_8', name: 'Tầng 8', qiRequired: 25000, bonuses: [{ attribute: 'Sinh Mệnh', value: 20 }, { attribute: 'Linh Lực', value: 20 }], description: 'Uy lực pháp thuật tăng mạnh.' },
            { id: 'lk_9', name: 'Tầng 9', qiRequired: 50000, bonuses: [{ attribute: 'Sinh Mệnh', value: 25 }, { attribute: 'Linh Lực', value: 25 }], description: 'Đạt tới đỉnh cao Luyện Khí, chuẩn bị Trúc Cơ.' },
            { id: 'lk_vien_man', name: 'Viên Mãn', qiRequired: 80000, bonuses: [{ attribute: 'Tuổi Thọ', value: 20 }, { attribute: 'Nguyên Thần', value: 5 }, { attribute: 'Thần Thức', value: 5 }], description: 'Linh lực cô đọng đến cực hạn, có thể thử Trúc Cơ.' },
        ]
    },
    { 
        id: 'truc_co', name: 'Trúc Cơ Kỳ', 
        description: 'Xây dựng nền tảng (Đạo Cơ) cho con đường tu luyện. Linh lực chuyển hóa thành chân nguyên, sức mạnh tăng vọt, tuổi thọ đạt 200 năm.',
        hasTribulation: true,
        tribulationDescription: 'Đây là Thiên Kiếp đầu tiên trên con đường tu tiên, sấm sét sẽ gột rửa phàm thể, xây dựng đạo cơ. Vượt qua thì thoát thai hoán cốt, thất bại thì thân tử đạo tiêu.',
        stages: [
            { id: 'tc_so_ky', name: 'Sơ Kỳ', qiRequired: 150000, bonuses: [{ attribute: 'Căn Cốt', value: 10 }, { attribute: 'Nguyên Thần', value: 5 }], description: 'Đạo cơ hình thành, thần thức có thể xuất ra ngoài dò xét.' },
            { id: 'tc_trung_ky', name: 'Trung Kỳ', qiRequired: 400000, bonuses: [{ attribute: 'Căn Cốt', value: 10 }, { attribute: 'Nguyên Thần', value: 5 }], description: 'Đạo cơ vững chắc, có thể bắt đầu ngự vật phi hành.' },
            { id: 'tc_hau_ky', name: 'Hậu Kỳ', qiRequired: 800000, bonuses: [{ attribute: 'Căn Cốt', value: 15 }, { attribute: 'Nguyên Thần', value: 10 }], description: 'Chân nguyên hùng hậu, uy lực pháp thuật tăng mạnh.' },
            { id: 'tc_vien_man', name: 'Viên Mãn', qiRequired: 1200000, bonuses: [{ attribute: 'Tuổi Thọ', value: 50 }, { attribute: 'Căn Cốt', value: 5 }, { attribute: 'Nguyên Thần', value: 5 }], description: 'Đạo cơ viên mãn, chuẩn bị ngưng tụ Kim Đan.' },
        ]
    },
    {
        id: 'ket_dan', name: 'Kết Đan Kỳ',
        description: 'Ngưng tụ toàn bộ chân nguyên trong cơ thể thành một viên Kim Đan. Tu sĩ chính thức bước vào hàng ngũ cao thủ, tuổi thọ tăng lên 500 năm.',
        stages: [
            { id: 'kd_so_ky', name: 'Sơ Kỳ', qiRequired: 2500000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 20 }, { attribute: 'Bền Bỉ', value: 15 }], description: 'Kim đan sơ thành, có thể sử dụng Đan hỏa.'},
            { id: 'kd_trung_ky', name: 'Trung Kỳ', qiRequired: 6000000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 20 }, { attribute: 'Bền Bỉ', value: 15 }], description: 'Kim đan ổn định, uy lực pháp thuật tăng mạnh.'},
            { id: 'kd_hau_ky', name: 'Hậu Kỳ', qiRequired: 15000000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 25 }, { attribute: 'Bền Bỉ', value: 20 }], description: 'Kim đan cường đại, có thể bắt đầu thai nghén Nguyên Anh.'},
            { id: 'kd_vien_man', name: 'Viên Mãn', qiRequired: 30000000, bonuses: [{ attribute: 'Tuổi Thọ', value: 150 }, { attribute: 'Linh Lực Sát Thương', value: 10 }, { attribute: 'Bền Bỉ', value: 10 }], description: 'Kim đan đại thành, chuẩn bị cho việc phá đan thành anh.'},
        ]
    },
    {
        id: 'nguyen_anh', name: 'Nguyên Anh Kỳ',
        description: 'Phá vỡ Kim Đan, thai nghén ra "Nguyên Anh". Nguyên Anh có thể xuất khiếu, ngao du thái hư. Tuổi thọ đạt 1000 năm.',
        hasTribulation: true,
        tribulationDescription: 'Phá đan thành anh là nghịch thiên chi举, sẽ phải đối mặt với Tâm Ma Kiếp. Vô số ảo ảnh, dục vọng từ sâu trong tâm thức sẽ trỗi dậy, chỉ có đạo tâm kiên định mới có thể vượt qua.',
        stages: [
            { id: 'na_so_ky', name: 'Sơ Kỳ', qiRequired: 80000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Ngộ Tính', value: 20 }], description: 'Nguyên Anh được sinh ra, có thể đoạt xá trùng sinh.' },
            { id: 'na_trung_ky', name: 'Trung Kỳ', qiRequired: 200000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Ngộ Tính', value: 20 }], description: 'Nguyên Anh lớn mạnh, có thể thi triển các thần thông mạnh mẽ.'},
            { id: 'na_hau_ky', name: 'Hậu Kỳ', qiRequired: 500000000, bonuses: [{ attribute: 'Nguyên Thần', value: 60 }, { attribute: 'Ngộ Tính', value: 30 }], description: 'Nguyên Anh và nhục thân bắt đầu hợp nhất.'},
            { id: 'na_vien_man', name: 'Viên Mãn', qiRequired: 900000000, bonuses: [{ attribute: 'Tuổi Thọ', value: 300 }, { attribute: 'Nguyên Thần', value: 20 }, { attribute: 'Ngộ Tính', value: 10 }], description: 'Nguyên Anh vững chắc, chuẩn bị cho Hóa Thần.'},
        ]
    },
    {
        id: 'hoa_than', name: 'Hóa Thần Kỳ',
        description: 'Nguyên Anh và nhục thân hoàn toàn dung hợp, lĩnh ngộ được một phần pháp tắc của thiên địa. Tu sĩ có thể di chuyển trong hư không, tuổi thọ trên 2000 năm.',
        stages: [
            { id: 'ht_so_ky', name: 'Sơ Kỳ', qiRequired: 2E9, bonuses: [{ attribute: 'Thân Pháp', value: 50 }, { attribute: 'Lực Lượng', value: 50 }], description: 'Sơ bộ nắm giữ pháp tắc không gian, có thể thuấn di.'},
            { id: 'ht_trung_ky', name: 'Trung Kỳ', qiRequired: 6E9, bonuses: [{ attribute: 'Thân Pháp', value: 60 }, { attribute: 'Lực Lượng', value: 60 }], description: 'Lĩnh ngộ sâu hơn về pháp tắc, có thể tạo ra lĩnh vực của riêng mình.' },
            { id: 'ht_hau_ky', name: 'Hậu Kỳ', qiRequired: 1.5E10, bonuses: [{ attribute: 'Thân Pháp', value: 70 }, { attribute: 'Lực Lượng', value: 70 }], description: 'Hoàn toàn nắm giữ một loại pháp tắc, chuẩn bị Luyện Hư.'},
            { id: 'ht_vien_man', name: 'Viên Mãn', qiRequired: 3E10, bonuses: [{ attribute: 'Tuổi Thọ', value: 1000 }, { attribute: 'Thân Pháp', value: 20 }, { attribute: 'Lực Lượng', value: 20 }], description: 'Lĩnh vực viên mãn, có thể phi thăng.'},
        ]
    },
    {
        id: 'nhan_tien', name: 'Nhân Tiên',
        description: 'Thoát khỏi vòng luân hồi, thân thể hóa thành tiên躯, không còn bị sinh lão bệnh tử trói buộc. Tuổi thọ vĩnh cửu.',
        stages: [
            { id: 'nt_so_ky', name: 'Sơ Kỳ', qiRequired: 1e14, bonuses: [{ attribute: 'Căn Cốt', value: 200 }], description: 'Tiên lực sơ thành, miễn cưỡng du hành trong hư không.' },
            { id: 'nt_trung_ky', name: 'Trung Kỳ', qiRequired: 3e14, bonuses: [{ attribute: 'Nguyên Thần', value: 200 }], description: 'Tiên thể dần ổn định.' },
            { id: 'nt_hau_ky', name: 'Hậu Kỳ', qiRequired: 7e14, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 200 }], description: 'Tiên thể vững chắc.' },
            { id: 'nt_vien_man', name: 'Viên Mãn', qiRequired: 1.2e15, bonuses: [{ attribute: 'Bền Bỉ', value: 200 }], description: 'Thần thông bắt đầu hiển lộ.' },
        ]
    },
    {
        id: 'thien_tien', name: 'Thiên Tiên',
        description: 'Tiên nhân của trời cao, hấp thụ thiên địa linh khí, tự do đi lại giữa các tầng trời. Pháp lực cao thâm.',
        stages: [
            { id: 'tt_so_ky', name: 'Sơ Kỳ', qiRequired: 5e16, bonuses: [{ attribute: 'Thân Pháp', value: 300 }], description: 'Ngự không phi hành, tốc độ như điện.' },
            { id: 'tt_trung_ky', name: 'Trung Kỳ', qiRequired: 1.5e17, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 300 }], description: 'Lĩnh ngộ pháp tắc không gian.' },
            { id: 'tt_hau_ky', name: 'Hậu Kỳ', qiRequired: 4e17, bonuses: [{ attribute: 'Nguyên Thần', value: 300 }], description: 'Thần thông biến hóa.' },
            { id: 'tt_vien_man', name: 'Viên Mãn', qiRequired: 8e17, bonuses: [{ attribute: 'Ngộ Tính', value: 100 }], description: 'Pháp lực viên mãn, chuẩn bị ngưng tụ Kim Tiên chi thân.' },
        ]
    },
    {
        id: 'kim_tien', name: 'Kim Tiên',
        description: 'Thân thể bất hoại, vạn kiếp không mài, là cảnh giới của phần lớn cao thủ trong tam giáo. Có tư cách khai tông lập phái.',
        stages: [
            { id: 'kt_so_ky', name: 'Sơ Kỳ', qiRequired: 2e18, bonuses: [{ attribute: 'Căn Cốt', value: 500 }], description: 'Kim thân sơ thành, miễn nhiễm với phần lớn pháp thuật cấp thấp.' },
            { id: 'kt_trung_ky', name: 'Trung Kỳ', qiRequired: 6e18, bonuses: [{ attribute: 'Bền Bỉ', value: 500 }], description: 'Kim thân cường đại, khó bị tổn thương.' },
            { id: 'kt_hau_ky', name: 'Hậu Kỳ', qiRequired: 1.5e19, bonuses: [{ attribute: 'Lực Lượng', value: 500 }], description: 'Sức mạnh của Kim thân đạt tới đỉnh điểm.' },
            { id: 'kt_vien_man', name: 'Viên Mãn', qiRequired: 3e19, bonuses: [{ attribute: 'Đạo Tâm', value: 100 }], description: 'Kim thân viên mãn, là trụ cột của các đại giáo.' },
        ]
    },
    {
        id: 'thai_at', name: 'Thái Ất Kim Tiên',
        description: 'Trên đỉnh đầu ngưng tụ tam hoa, trong lồng ngực kết thành ngũ khí. Là cấp bậc của Thập Nhị Kim Tiên Xiển Giáo.',
        stages: [
            { id: 'ta_so_ky', name: 'Sơ Kỳ', qiRequired: 1e20, bonuses: [{ attribute: 'Nguyên Thần', value: 400 }], description: 'Bắt đầu ngưng tụ Tam hoa.' },
            { id: 'ta_trung_ky', name: 'Trung Kỳ', qiRequired: 5e20, bonuses: [{ attribute: 'Ngộ Tính', value: 250 }], description: 'Tam hoa Tụ đỉnh, vạn pháp bất xâm.' },
            { id: 'ta_hau_ky', name: 'Hậu Kỳ', qiRequired: 1e21, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 400 }], description: 'Bắt đầu ngưng tụ Ngũ khí.' },
            { id: 'ta_vien_man', name: 'Viên Mãn', qiRequired: 2e21, bonuses: [{ attribute: 'Bền Bỉ', value: 400 }], description: 'Ngũ khí Triều nguyên, pháp lực vô biên.' },
        ]
    },
    {
        id: 'dai_la', name: 'Đại La Kim Tiên',
        description: 'Nhảy ra khỏi tam giới, không còn trong ngũ hành. Đại La có nghĩa là tất cả không gian và thời gian, vĩnh hằng tự tại.',
        stages: [
            { id: 'dl_so_ky', name: 'Sơ Kỳ', qiRequired: 1e22, bonuses: [{ attribute: 'Cơ Duyên', value: 200 }], description: 'Thoát khỏi xiềng xích của số mệnh.' },
            { id: 'dl_trung_ky', name: 'Trung Kỳ', qiRequired: 5e22, bonuses: [{ attribute: 'Đạo Tâm', value: 200 }], description: 'Không bị nhân quả trói buộc.' },
            { id: 'dl_hau_ky', name: 'Hậu Kỳ', qiRequired: 1e23, bonuses: [{ attribute: 'Nhân Quả', value: -100 }], description: 'Ngao du trong dòng sông thời gian.' },
            { id: 'dl_vien_man', name: 'Viên Mãn', qiRequired: 2e23, bonuses: [{ attribute: 'Tuổi Thọ', value: 99999 }], description: 'Bất tử bất diệt.' },
        ]
    },
    {
        id: 'chuan_thanh', name: 'Chuẩn Thánh',
        description: 'Chém tam thi, đã bước một chân vào cảnh giới Thánh Nhân. Là những tồn tại kinh khủng nhất dưới Thánh Nhân.',
        stages: [
            { id: 'ct_so_ky', name: 'Trảm Nhất Thi', qiRequired: 1e25, bonuses: [{ attribute: 'Lực Lượng', value: 2000 }], description: 'Chém bỏ một trong ba xác (thiện, ác, chấp niệm), sức mạnh tăng vọt.' },
            { id: 'ct_trung_ky', name: 'Trảm Nhị Thi', qiRequired: 5e25, bonuses: [{ attribute: 'Nguyên Thần', value: 2000 }], description: 'Chém bỏ hai xác, đã có thể được gọi là Á Thánh.' },
            { id: 'ct_hau_ky', name: 'Trảm Tam Thi', qiRequired: 1e26, bonuses: [{ attribute: 'Đạo Tâm', value: 1000 }], description: 'Chém cả ba xác, chỉ còn một bước nữa là chứng đạo thành Thánh.' },
            { id: 'ct_vien_man', name: 'Viên Mãn', qiRequired: 2e26, bonuses: [{ attribute: 'Ngộ Tính', value: 1000 }], description: 'Chỉ còn chờ cơ duyên để chứng đạo.' },
        ]
    },
    {
        id: 'thanh_nhan', name: 'Thánh Nhân',
        description: 'Thiên đạo Thánh Nhân, vạn kiếp bất diệt, nguyên thần ký thác vào thiên đạo. Dưới thiên đạo đều là con kiến.',
        stages: [
            { id: 'tn_1', name: 'Thánh Nhân', qiRequired: Infinity, bonuses: [], description: 'Ngôn xuất pháp tùy, một lời nói có thể thay đổi thiên đạo.' },
        ]
    }
];