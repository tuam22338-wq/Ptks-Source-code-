// src/data/storyTemplates.ts
export interface StoryTemplate {
  id: string;
  genre: string;
  title: string;
  description: string;
  mainGoal: string;
  openingStory: string;
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  // --- Huyền Huyễn Tu Tiên ---
  {
    id: 'xianxia_revenge',
    genre: 'Huyền Huyễn Tu Tiên',
    title: 'Diệt Môn Trọng Sinh',
    description: 'Tông môn bị hủy diệt, bạn là người sống sót duy nhất mang trong mình mối thù huyết hải, may mắn trọng sinh hoặc có được kỳ ngộ, bước lên con đường tu luyện để báo thù và khôi phục lại môn phái.',
    mainGoal: 'Điều tra kẻ đã hủy diệt tông môn, tu luyện để trở nên hùng mạnh và báo thù.',
    openingStory: 'Trong đống tro tàn của Huyền Thiên Môn, bạn tỉnh dậy với thân thể đầy thương tích và một trái tim tan nát. Ký ức về đêm kinh hoàng, khi kẻ thù bí ẩn tàn sát đồng môn, vẫn còn như in. May mắn thay, một bảo vật của tông môn đã bảo vệ linh hồn bạn, giúp bạn giữ lại được một mạng. Nhìn về phía chân trời xa, bạn thề sẽ tìm ra sự thật và bắt kẻ thù trả giá.',
  },
  {
    id: 'xianxia_mortal',
    genre: 'Huyền Huyễn Tu Tiên',
    title: 'Phàm Nhân Nghịch Tập',
    description: 'Bạn chỉ là một phàm nhân với tư chất bình thường, tình cờ nhặt được một món bảo vật défiant, từ đó mở ra con đường tu tiên đầy chông gai nhưng cũng không thiếu kỳ ngộ.',
    mainGoal: 'Khám phá bí mật của món bảo vật, từng bước tu luyện, vượt qua những kẻ có thiên phú hơn người để chứng tỏ bản thân.',
    openingStory: 'Là một thiếu niên bình thường ở một ngôi làng hẻo lánh, giấc mơ tu tiên dường như quá xa vời với bạn. Trong một lần lên núi hái thuốc, bạn vô tình rơi xuống một sơn động bí ẩn và tìm thấy một chiếc bình nhỏ cũ kỹ. Khi máu của bạn vô tình nhỏ vào, chiếc bình tỏa ra ánh sáng chói lòa, kéo bạn vào một không gian khác...',
  },
  {
    id: 'xianxia_awakening',
    genre: 'Huyền Huyễn Tu Tiên',
    title: 'Thức Tỉnh Dị Bảo',
    description: 'Từ nhỏ trong cơ thể bạn đã ẩn chứa một bí mật kinh thiên - có thể là một linh hồn cường giả thượng cổ, một hệ thống bí ẩn, hoặc một thần khí vô song. Vào một ngày định mệnh, nó thức tỉnh.',
    mainGoal: 'Tìm hiểu về nguồn gốc của bí mật trong cơ thể mình và học cách kiểm soát sức mạnh mới.',
    openingStory: 'Cuộc sống của bạn vốn luôn bình lặng cho đến ngày bạn bị kẻ thù truy sát đến bờ vực sinh tử. Trong khoảnh khắc tuyệt vọng, một giọng nói xa xưa vang lên trong đầu bạn: "Hài tử, cuối cùng ngươi cũng đã đánh thức ta...". Một luồng sức mạnh khổng lồ tuôn trào từ sâu trong cơ thể, giúp bạn lật ngược tình thế.',
  },

  // --- Võ Hiệp Giang Hồ ---
  {
    id: 'wuxia_revenge',
    genre: 'Võ Hiệp Giang Hồ',
    title: 'Báo Thù Rửa Hận',
    description: 'Gia đình bạn bị một thế lực bí ẩn trong giang hồ thảm sát. May mắn sống sót, bạn lên đường tìm thầy học võ, quyết tâm tìm ra chân tướng và báo thù cho người thân.',
    mainGoal: 'Truy tìm manh mối về kẻ thù đã hãm hại gia đình và luyện thành tuyệt thế võ công để báo thù.',
    openingStory: 'Dưới ánh trăng mờ, bạn quỳ gối trước những ngôi mộ mới đắp, mùi máu tanh vẫn chưa tan hết. Ký ức về những bóng đen và ánh đao lạnh lẽo cướp đi gia đình bạn đã khắc sâu vào tâm trí. Tay nắm chặt miếng ngọc bội vỡ nát - manh mối duy nhất - bạn quay lưng lại với quá khứ, bước chân vào chốn giang hồ hiểm ác.',
  },
  {
    id: 'wuxia_leader',
    genre: 'Võ Hiệp Giang Hồ',
    title: 'Minh Chủ Tranh Đoạt',
    description: 'Võ lâm đại loạn, các cao thủ tranh giành Tín vật Minh chủ đã mất tích từ lâu. Bạn, một thiếu hiệp vô danh, vô tình bị cuốn vào vòng xoáy tranh đoạt này.',
    mainGoal: 'Sống sót giữa các thế lực giang hồ, tìm ra Tín vật Minh chủ và quyết định vận mệnh của võ lâm.',
    openingStory: 'Tại một quán trà nhỏ ven đường, bạn tình cờ nghe được câu chuyện về Thiết Kiếm Lệnh - tín vật hiệu triệu võ lâm. Bất ngờ, một cuộc ẩu đả nổ ra, và một lão ăn mày hấp hối đã nhét vào tay bạn một vật cứng, lạnh lẽo. "Cầm lấy... đừng để nó rơi vào tay kẻ xấu..." Lão trăn trối. Khi mở tay ra, đó chính là Thiết Kiếm Lệnh trong truyền thuyết.',
  },
  {
    id: 'wuxia_amnesia',
    genre: 'Võ Hiệp Giang Hồ',
    title: 'Lãng Tử Vô Danh',
    description: 'Bạn tỉnh dậy bên bờ suối với một vết thương trên đầu và không một chút ký ức. Bên cạnh chỉ có một thanh kiếm lạ. Bạn lang thang trên giang hồ để tìm lại quá khứ của mình.',
    mainGoal: 'Tìm lại ký ức đã mất và thân phận thực sự của bản thân.',
    openingStory: 'Dòng nước mát lạnh làm bạn tỉnh giấc. Bạn không nhớ mình là ai, tại sao lại ở đây. Đầu đau nhói, và ký ức là một khoảng trống rỗng. Duy chỉ có thanh kiếm nằm bên cạnh dường như rất quen thuộc. Bạn đứng dậy, nhìn về con đường vô định phía trước, bắt đầu hành trình tìm lại chính mình.',
  },

  // --- Khoa Huyễn Viễn Tưởng ---
  {
    id: 'scifi_memory',
    genre: 'Khoa Huyễn Viễn Tưởng',
    title: 'Thức Tỉnh Ký Ức',
    description: 'Bạn là một công dân bình thường trong thành phố Neo-Kyoto, cho đến khi một tai nạn bất ngờ kích hoạt những ký ức bị chôn vùi. Bạn nhận ra mình là một đặc vụ/siêu chiến binh bị xóa trí nhớ.',
    mainGoal: 'Tìm hiểu về quá khứ bị lãng quên của mình và lý do tại sao mình lại bị xóa trí nhớ.',
    openingStory: 'Một chiếc xe bay mất lái đã gần như kết liễu cuộc đời bạn. Nhưng trong khoảnh khắc đó, cơ thể bạn phản ứng một cách phi thường. Thời gian dường như chậm lại, và những hình ảnh xa lạ loé lên trong đầu: những cuộc chiến, những mật mã, một khuôn mặt quen thuộc... Khi tỉnh lại trong bệnh viện, bạn biết rằng cuộc sống của một nhân viên văn phòng đã chấm dứt.',
  },
  {
    id: 'scifi_resistance',
    genre: 'Khoa Huyễn Viễn Tưởng',
    title: 'Kháng Chiến Chống Tập Đoàn',
    description: 'Trong một thế giới bị thống trị bởi các siêu tập đoàn, bạn là một hacker/lính đánh thuê sống ở tầng lớp dưới. Bạn tình cờ phát hiện ra một âm mưu tàn độc và quyết định tham gia phong trào kháng chiến.',
    mainGoal: 'Lật đổ hoặc phơi bày âm mưu của siêu tập đoàn OmniCorp.',
    openingStory: 'Trong một lần xâm nhập vào mạng lưới của tập đoàn OmniCorp để kiếm chút tiền, bạn vô tình tải về một tệp dữ liệu được mã hóa cấp cao nhất. Những gì bạn thấy trong đó còn tồi tệ hơn cả tưởng tượng: những thí nghiệm vô nhân đạo, những kế hoạch kiểm soát tâm trí... Ngay sau đó, bạn trở thành mục tiêu truy sát của OmniCorp. Không còn đường lui, bạn chỉ có thể tìm đến những người trong bóng tối.',
  },
  {
    id: 'scifi_crash',
    genre: 'Khoa Huyễn Viễn Tưởng',
    title: 'Hành Tinh Lạc Lối',
    description: 'Là một nhà thám hiểm không gian, phi thuyền của bạn gặp sự cố và rơi xuống một hành tinh không có trên bản đồ sao. Bạn phải sinh tồn và khám phá những bí mật cổ xưa của nơi này.',
    mainGoal: 'Sinh tồn trên hành tinh xa lạ và tìm cách liên lạc với thế giới bên ngoài.',
    openingStory: 'Tiếng báo động đỏ và những cú va chạm kinh hoàng là điều cuối cùng bạn nhớ được. Khi mở mắt, bạn thấy mình đang ở trong khoang cứu hộ, và bên ngoài là một khu rừng kỳ lạ với những loài thực vật phát quang. Dữ liệu cho thấy hành tinh này không thể ở được, nhưng bạn vẫn đang thở. Tín hiệu liên lạc đã mất, và bạn hoàn toàn đơn độc.',
  },

  // --- Hậu Tận Thế & Sinh Tồn ---
  {
    id: 'apocalypse_survivor',
    genre: 'Hậu Tận Thế & Sinh Tồn',
    title: 'Kẻ Sống Sót Đơn Độc',
    description: 'Sau thảm họa, bạn là một trong số ít những người còn sống sót. Bạn phải đối mặt với sự khắc nghiệt của thế giới mới, tìm kiếm tài nguyên và chống lại những mối nguy hiểm.',
    mainGoal: 'Tìm kiếm một nơi an toàn để xây dựng lại cuộc sống và tìm kiếm những người sống sót khác.',
    openingStory: 'Sự im lặng là thứ đáng sợ nhất. Đã nhiều tháng kể từ khi "Cơn Sốt Đỏ" quét qua thế giới. Bạn đang trú ẩn trong một siêu thị đổ nát. Lương thực đã cạn, và bạn biết mình không thể ở đây mãi. Hôm nay, bạn phải ra ngoài, đối mặt với những con phố hoang tàn và những kẻ đã biến chất.',
  },
  {
    id: 'apocalypse_quest',
    genre: 'Hậu Tận Thế & Sinh Tồn',
    title: 'Hành Trình Tìm Thuốc Cứu Chữa',
    description: 'Cộng đồng nhỏ của bạn đang bị đe dọa bởi một căn bệnh mới. Bạn là người duy nhất đủ dũng cảm để lên đường tìm kiếm phương thuốc tại một phòng thí nghiệm cũ của quân đội.',
    mainGoal: 'Đến được phòng thí nghiệm Elysium và tìm ra thuốc giải hoặc dữ liệu nghiên cứu.',
    openingStory: 'Tiếng ho của đứa trẻ trong khu bệnh xá ngày càng yếu đi. Cộng đồng "Hy Vọng" đang chết dần. Trưởng lão đã trao cho bạn tấm bản đồ cuối cùng, chỉ đường đến một nơi gọi là "Elysium" - một phòng thí nghiệm quân sự từ thời tiền tận thế. Đó là hy vọng duy nhất, và bạn không thể thất bại.',
  },
  {
    id: 'apocalypse_mutant',
    genre: 'Hậu Tận Thế & Sinh Tồn',
    title: 'Kẻ Bị Ruồng Bỏ',
    description: 'Bạn không phải là một người sống sót bình thường. Bạn đã bị biến đổi bởi thảm họa, mang trong mình sức mạnh dị thường nhưng cũng bị con người xa lánh. Bạn phải tìm chỗ đứng cho mình trong thế giới khắc nghiệt này.',
    mainGoal: 'Tìm một nơi chấp nhận những người như bạn, hoặc tạo ra một nơi như vậy.',
    openingStory: 'Họ gọi bạn là "quái vật". Cánh tay phát ra ánh sáng kỳ lạ của bạn là bằng chứng cho sự biến đổi. Bị đuổi khỏi khu định cư cuối cùng, bạn lang thang trong vùng đất chết. Cơn đói và sự cô độc gặm nhấm, nhưng một sức mạnh mới cũng đang trỗi dậy bên trong, một sức mạnh có thể giúp bạn sống sót, hoặc hủy diệt tất cả.',
  },
];
