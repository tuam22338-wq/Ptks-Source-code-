// src/data/promptTemplates.ts

export interface PromptTemplate {
  category: string;
  title: string;
  description: string;
  prompt: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // --- Kiến tạo Thế giới (World Building) ---
  {
    category: 'Kiến tạo Thế giới',
    title: 'Tạo Hệ thống Phép thuật Mới',
    description: 'Sử dụng cấu trúc rõ ràng để AI thiết kế một hệ thống phép thuật độc đáo với các quy luật, nguồn gốc và giới hạn cụ thể.',
    prompt: `Bạn là một chuyên gia sáng tạo thế giới. Hãy thiết kế một hệ thống phép thuật mới có tên là "[Tên hệ thống phép thuật]".

Phân tích và mô tả hệ thống này theo các mục sau:
1.  **Nguồn gốc sức mạnh:** Phép thuật này đến từ đâu? (Vd: Năng lượng vũ trụ, khế ước với thực thể, thao túng gen, một loại tài nguyên hiếm).
2.  **Nguyên tắc hoạt động:** Người sử dụng kích hoạt phép thuật như thế nào? (Vd: Niệm chú, vẽ ấn, hiến tế, sử dụng công nghệ).
3.  **Phân loại & Trường phái:** Phép thuật này có những nhánh hoặc loại nào? (Vd: Nguyên tố, Tâm linh, Hắc ám, Triệu hồi).
4.  **Giới hạn & Cái giá phải trả:** Việc sử dụng phép thuật có giới hạn gì? Cái giá phải trả là gì? (Vd: Tốn năng lượng, giảm tuổi thọ, mất đi ký ức, gây ra ô nhiễm ma thuật).
5.  **Biểu hiện:** Phép thuật trông như thế nào khi được thi triển? (Vd: Ánh sáng rực rỡ, ký tự cổ ngữ bay lượn, biến dạng không gian).
6.  **Xung đột cốt lõi:** Hệ thống phép thuật này tạo ra những xung đột nào trong xã hội? (Vd: Phân biệt giai cấp giữa người có và không có phép thuật, chiến tranh giành tài nguyên ma thuật).`
  },
  {
    category: 'Kiến tạo Thế giới',
    title: 'Thiết kế một Thành phố Độc đáo',
    description: 'Cung cấp các khía cạnh cần thiết để AI xây dựng một thành phố sống động và đáng nhớ, từ kiến trúc đến văn hóa.',
    prompt: `Hãy mô tả chi tiết một thành phố giả tưởng có tên là "[Tên thành phố]".

Tập trung vào các khía cạnh sau:
1.  **Vị trí địa lý & Môi trường:** Thành phố nằm ở đâu? (Vd: Trên lưng một con rùa khổng lồ,ลอย lơ lửng giữa trời, trong một miệng núi lửa đã tắt).
2.  **Kiến trúc:** Kiến trúc của thành phố có gì đặc biệt? (Vd: Những ngọn tháp xoắn ốc bằng pha lê, các tòa nhà được chạm khắc từ xương của những sinh vật khổng lồ).
3.  **Lịch sử & Nguồn gốc:** Thành phố được thành lập như thế nào và có những sự kiện lịch sử quan trọng nào?
4.  **Cư dân & Văn hóa:** Ai sống ở đây? Họ có những phong tục, tín ngưỡng, hoặc lễ hội đặc trưng nào?
5.  **Kinh tế & Chính trị:** Thành phố hoạt động dựa trên ngành kinh tế nào? Ai là người cai trị và hệ thống luật pháp ra sao?
6.  **Một địa điểm nổi tiếng:** Mô tả một địa danh đặc biệt trong thành phố (Vd: Chợ Đêm Không Ngủ, Thư Viện Cấm, Đấu trường Cát Máu).`
  },
  {
    category: 'Kiến tạo Thế giới',
    title: 'Tạo một Tôn giáo/Tín ngưỡng',
    description: 'Định hình một hệ thống tín ngưỡng có chiều sâu bằng cách yêu cầu AI xác định các vị thần, giáo lý, và nghi lễ.',
    prompt: `Hãy sáng tạo một tôn giáo/tín ngưỡng mới có tên là "[Tên tôn giáo]".

Mô tả chi tiết dựa trên các yếu tố sau:
1.  **Đối tượng thờ phụng:** Họ thờ ai hoặc cái gì? (Vd: Một vị thần duy nhất, một hội đồng các vị thần, các linh hồn tự nhiên, một khái niệm trừu tượng như "Sự Cân Bằng").
2.  **Thần thoại & Sáng thế:** Tôn giáo này giải thích nguồn gốc của thế giới và con người như thế nào? Có những câu chuyện thần thoại quan trọng nào?
3.  **Giáo lý & Triết học cốt lõi:** Những niềm tin và nguyên tắc sống chính của các tín đồ là gì? (Vd: Từ bi, hiến dâng, chinh phục, tìm kiếm tri thức).
4.  **Nghi lễ & Thực hành:** Các tín đồ thực hành tôn giáo của họ như thế nào? (Vd: Cầu nguyện hàng ngày, hành hương, các nghi lễ hiến tế, thiền định).
5.  **Tổ chức & Tăng lữ:** Tôn giáo có được tổ chức chặt chẽ không? Ai là người đứng đầu và có các cấp bậc giáo sĩ nào?
6.  **Biểu tượng:** Biểu tượng chính của tôn giáo này là gì?`
  },
  {
    category: 'Kiến tạo Thế giới',
    title: 'Lịch sử của một Cuộc chiến Vĩ đại',
    description: 'Yêu cầu AI viết về một cuộc xung đột lớn, tập trung vào nguyên nhân, diễn biến và hậu quả để tạo ra một bối cảnh lịch sử phong phú.',
    prompt: `Hãy viết một bản tóm tắt lịch sử về một cuộc chiến tranh vĩ đại được biết đến với tên gọi "[Tên cuộc chiến]".

Bao gồm các phần sau:
1.  **Nguyên nhân Bùng nổ:** Điều gì đã châm ngòi cho cuộc chiến? (Vd: Tranh chấp lãnh thổ, xung đột ý thức hệ, sự phản bội, một lời tiên tri).
2.  **Các phe tham chiến:** Những phe phái/quốc gia nào đã tham gia và ai là lãnh đạo của họ?
3.  **Diễn biến chính & Các trận đánh quan trọng:** Mô tả ngắn gọn các giai đoạn của cuộc chiến và kể tên một hoặc hai trận đánh quyết định.
4.  **Kết quả:** Phe nào đã chiến thắng? Cuộc chiến kết thúc như thế nào?
5.  **Hậu quả & Di sản:** Cuộc chiến đã thay đổi thế giới như thế nào? (Vd: Bản đồ chính trị được vẽ lại, công nghệ mới ra đời, một chủng tộc bị diệt vong, để lại những vết sẹo lâu dài trong văn hóa).`
  },
  {
    category: 'Kiến tạo Thế giới',
    title: 'Sáng tạo một Sinh vật Huyền bí',
    description: 'Hướng dẫn AI tạo ra một sinh vật độc đáo, từ ngoại hình, tập tính đến vai trò của nó trong hệ sinh thái.',
    prompt: `Hãy thiết kế một sinh vật huyền bí hoàn toàn mới có tên là [Tên sinh vật].

Cung cấp các chi tiết sau:
1.  **Ngoại hình:** Mô tả chi tiết hình dáng, kích thước, màu sắc và các đặc điểm nổi bật của sinh vật.
2.  **Môi trường sống:** Nó sống ở đâu? Môi trường đó có đặc điểm gì?
3.  **Tập tính & Chế độ ăn:** Nó hành xử như thế nào? Nó là loài săn mồi hay ăn cỏ? Nó có tập tính xã hội không?
4.  **Năng lực đặc biệt:** Nó có khả năng phi thường nào không? (Vd: Phun lửa, tàng hình, giao tiếp thần giao cách cảm).
5.  **Vai trò trong Hệ sinh thái/Thế giới:** Nó đóng vai trò gì trong thế giới của bạn? (Vd: Thú cưỡi, nguồn tài nguyên quý hiếm, một loài vật linh thiêng, một hiểm họa).`
  },
  {
    category: 'Kiến tạo Thế giới',
    title: 'Thiết kế một Tổ chức/Phe phái',
    description: 'Xây dựng một tổ chức có cấu trúc, mục tiêu, và vị thế rõ ràng trong thế giới của bạn.',
    prompt: `Hãy tạo ra một tổ chức/phe phái mới có tên là "[Tên tổ chức]".

Mô tả chi tiết theo cấu trúc:
1.  **Mục tiêu & Tư tưởng:** Mục đích tồn tại của tổ chức này là gì? (Vd: Bảo vệ tri thức cổ, tích lũy quyền lực, lật đổ chính quyền, duy trì sự cân bằng tự nhiên).
2.  **Lãnh đạo & Cấu trúc:** Ai là người đứng đầu? Tổ chức có hệ thống cấp bậc như thế nào?
3.  **Thành viên:** Họ tuyển mộ những loại người nào?
4.  **Phương thức hoạt động:** Họ hoạt động công khai hay bí mật? Họ sử dụng những phương pháp nào để đạt được mục tiêu? (Vd: Chính trị, gián điệp, ám sát, nghiên cứu, chiến tranh).
5.  **Vị thế trong thế giới:** Họ được các phe phái khác nhìn nhận như thế nào? (Vd: Được kính trọng, bị căm ghét, là một huyền thoại).`
  },

  // --- Phát triển Nhân vật (Character Development) ---
  {
    category: 'Phát triển Nhân vật',
    title: 'Tạo Tiểu sử Nhân vật Phản diện',
    description: 'Xây dựng một nhân vật phản diện có chiều sâu bằng cách khám phá động cơ, quá khứ và triết lý của họ, thay vì chỉ là "kẻ ác".',
    prompt: `Hãy tạo ra một nhân vật phản diện phức tạp có tên là "[Tên nhân vật phản diện]". Đừng chỉ mô tả họ là "kẻ ác".

Hãy trả lời các câu hỏi sau để xây dựng nhân vật này:
1.  **Mục tiêu cuối cùng:** Họ thực sự muốn đạt được điều gì? (Vd: Mang lại "hòa bình" bằng cách xóa bỏ ý chí tự do, hồi sinh người thân yêu bằng mọi giá, chứng minh triết lý của mình là đúng).
2.  **Động cơ:** Tại sao họ lại muốn điều đó? Điều gì trong quá khứ đã đẩy họ đến con đường này? (Vd: Bị phản bội, chứng kiến sự bất công, mất mát người thân).
3.  **Triết lý:** Họ biện minh cho hành động của mình như thế nào? Họ có tin rằng mình đang làm điều đúng đắn không?
4.  **Điểm mạnh & Điểm yếu:** Họ có những năng lực phi thường nào, và có những điểm yếu nào (cả về thể chất và tinh thần)?
5.  **Mối quan hệ:** Họ có mối quan hệ quan trọng nào không (với đồng minh, kẻ thù, hoặc một người họ vẫn còn quan tâm)?
6.  **Phong thái:** Họ hành xử và nói chuyện như thế nào? (Vd: Lịch thiệp nhưng tàn nhẫn, điên loạn và khó đoán, trầm lặng và uy nghiêm).`
  },
  {
    category: 'Phát triển Nhân vật',
    title: 'Phát triển Mối quan hệ giữa Hai nhân vật',
    description: 'Khám phá sự phức tạp trong mối quan hệ của hai nhân vật, từ nguồn gốc đến những xung đột tiềm tàng.',
    prompt: `Hãy phân tích và phát triển mối quan hệ giữa hai nhân vật: [Nhân vật A] và [Nhân vật B].

Trả lời các câu hỏi sau:
1.  **Gặp gỡ lần đầu:** Họ gặp nhau trong hoàn cảnh nào? Ấn tượng đầu tiên của họ về nhau là gì?
2.  **Bản chất mối quan hệ:** Mối quan hệ hiện tại của họ là gì? (Vd: Đồng minh bất đắc dĩ, thầy trò, đối thủ truyền kiếp, bạn thân, tình yêu bị cấm đoán).
3.  **Điểm chung & Khác biệt:** Điều gì kết nối họ với nhau, và điều gì khiến họ khác biệt hoặc mâu thuẫn?
4.  **Một kỷ niệm quan trọng:** Mô tả một sự kiện quan trọng trong quá khứ đã định hình mối quan hệ của họ.
5.  **Xung đột tiềm tàng:** Điều gì có thể phá vỡ hoặc thử thách mối quan hệ của họ trong tương lai?`
  },
  {
    category: 'Phát triển Nhân vật',
    title: 'Tạo một Người thầy/Cố vấn',
    description: 'Thiết kế một nhân vật cố vấn đáng nhớ, người sẽ dẫn dắt nhân vật chính, với những bài học, bí mật và có thể cả những thiếu sót riêng.',
    prompt: `Hãy tạo ra một nhân vật người thầy/cố vấn có tên là [Tên người thầy].

Mô tả nhân vật này dựa trên các điểm sau:
1.  **Ngoại hình & Phong thái:** Họ trông như thế nào và toát ra vẻ gì? (Vd: Lão nhân uyên bác, chiến binh dày dạn kinh nghiệm, một người lập dị và bí ẩn).
2.  **Chuyên môn:** Họ là chuyên gia trong lĩnh vực nào? (Vd: Kiếm thuật, phép thuật cổ đại, chiến lược quân sự, nghệ thuật sinh tồn).
3.  **Bài học quan trọng nhất:** Bài học cốt lõi mà họ muốn truyền dạy cho học trò của mình là gì (cả về kỹ năng và triết lý sống)?
4.  **Quá khứ bí ẩn:** Họ có một bí mật hoặc một nuối tiếc nào trong quá khứ không?
5.  **Phương pháp giảng dạy:** Họ dạy dỗ học trò như thế nào? (Vd: Nghiêm khắc và kỷ luật, khuyến khích sự sáng tạo, hay để học trò tự học hỏi qua thử thách).`
  },
  {
    category: 'Phát triển Nhân vật',
    title: 'Tạo Hồ sơ Nhân vật Chính',
    description: 'Một prompt toàn diện để xây dựng nền tảng cho một nhân vật chính đáng nhớ và có chiều sâu.',
    prompt: `Hãy tạo một hồ sơ chi tiết cho nhân vật chính có tên là [Tên nhân vật].

Điền vào các thông tin sau:
1.  **Ngoại hình:** Mô tả chi tiết về ngoại hình, trang phục thường ngày.
2.  **Tiểu sử:** Tóm tắt câu chuyện nền của nhân vật trước khi câu chuyện bắt đầu.
3.  **Tính cách:** Nêu 3 đặc điểm tính cách nổi bật (Vd: Dũng cảm, bốc đồng, trung thành) và giải thích ngắn gọn.
4.  **Mục tiêu (Goal):** Mục tiêu trước mắt của nhân vật là gì?
5.  **Động cơ (Motivation):** Lý do sâu xa đằng sau mục tiêu đó là gì?
6.  **Nỗi sợ lớn nhất:** Điều gì khiến nhân vật sợ hãi nhất?
7.  **Thiếu sót lớn nhất (Flaw):** Nhân vật có điểm yếu hoặc thiếu sót nào trong tính cách?`
  },

  // --- Thiết kế Cốt truyện (Plot Design) ---
  {
    category: 'Thiết kế Cốt truyện',
    title: 'Sáng tạo một Lời tiên tri Mơ hồ',
    description: 'Viết một lời tiên tri có thể được diễn giải theo nhiều cách, tạo ra sự căng thẳng và những cú ngoặt bất ngờ cho câu chuyện.',
    prompt: `Hãy viết một lời tiên tri cổ xưa, mơ hồ và đầy tính biểu tượng. Lời tiên tri này nên có thể được diễn giải theo nhiều cách khác nhau.

Lời tiên tri phải bao gồm:
1.  Một điềm báo về sự thay đổi lớn ("Khi mặt trăng nhuốm máu...").
2.  Sự xuất hiện của một nhân vật định mệnh ("Một đứa trẻ mang dấu ấn của rồng sẽ trỗi dậy...").
3.  Một hành động hoặc lựa chọn quan trọng ("...sẽ phải lựa chọn giữa việc cứu lấy vương miện hoặc trái tim.").
4.  Một kết quả mơ hồ có thể là tốt hoặc xấu ("...và bóng tối hoặc bình minh sẽ bao trùm vạn vật.").

Hãy kết hợp các yếu tố này thành một đoạn văn ngắn mang âm hưởng thần bí.`
  },
  {
    category: 'Thiết kế Cốt truyện',
    title: 'Thiết kế một Cú ngoặt (Plot Twist)',
    description: 'Yêu cầu AI tạo ra một cú ngoặt bất ngờ bằng cách đưa ra một tình huống và yêu cầu lật ngược nó một cách logic.',
    prompt: `Dựa trên tình huống sau, hãy tạo ra một cú ngoặt (plot twist) bất ngờ nhưng hợp lý.

**Tình huống hiện tại:**
Nhân vật chính, [Tên nhân vật chính], đã chiến đấu và đánh bại tên trùm cuối, [Tên trùm cuối], để giải cứu vương quốc. Mọi người đang ăn mừng chiến thắng.

**Yêu cầu:**
Hãy viết một đoạn văn mô tả một sự thật được tiết lộ ngay sau chiến thắng, làm thay đổi hoàn toàn ý nghĩa của những gì vừa xảy ra.

Gợi ý để xem xét:
- Người thầy của nhân vật chính thực ra mới là kẻ chủ mưu.
- "Trùm cuối" thực ra đang cố gắng ngăn chặn một thảm họa còn lớn hơn.
- Chiến thắng của nhân vật chính vô tình đã giải phóng một thế lực tà ác cổ xưa.
- Toàn bộ cuộc phiêu lưu chỉ là một ảo ảnh hoặc một bài kiểm tra.`
  },
  {
    category: 'Thiết kế Cốt truyện',
    title: 'Tạo một Tình thế Lưỡng nan',
    description: 'Đặt nhân vật vào một tình huống khó xử không có câu trả lời đúng hoàn toàn, buộc họ phải đưa ra một lựa chọn khó khăn.',
    prompt: `Hãy tạo ra một tình thế lưỡng nan (moral dilemma) cho nhân vật chính.

Tình huống phải có các yếu tố sau:
1.  **Bối cảnh:** Mô tả ngắn gọn tình huống nguy cấp mà nhân vật đang đối mặt. (Vd: Một thành phố đang bị dịch bệnh tàn phá).
2.  **Lựa chọn A:** Một lựa chọn có vẻ đúng đắn về mặt đạo đức nhưng có thể dẫn đến hậu quả tồi tệ. (Vd: Phân phát phương thuốc duy nhất cho những người yếu nhất, nhưng không đủ để cứu tất cả và có thể khiến dịch bệnh lây lan).
3.  **Lựa chọn B:** Một lựa chọn tàn nhẫn hoặc thực dụng nhưng có thể mang lại kết quả tốt hơn trên diện rộng. (Vd: Dùng phương thuốc để nghiên cứu và tạo ra một liều thuốc đại trà trong tương lai, nhưng phải hy sinh những người bệnh hiện tại).

Hãy mô tả tình huống và hai lựa chọn một cách rõ ràng, nhấn mạnh vào hậu quả của mỗi lựa chọn.`
  },
  {
    category: 'Thiết kế Cốt truyện',
    title: 'Brainstorm Ý tưởng Nhiệm vụ phụ',
    description: 'Tạo nhanh nhiều ý tưởng nhiệm vụ phụ dựa trên một bối cảnh hoặc địa điểm cụ thể.',
    prompt: `Dựa trên bối cảnh của [Tên địa điểm, vd: một thành phố cảng tấp nập], hãy đưa ra 5 ý tưởng nhiệm vụ phụ cho người chơi.

Mỗi ý tưởng nên bao gồm:
- **Tên nhiệm vụ:** Một cái tên gợi hình.
- **Người giao nhiệm vụ:** Ai sẽ nhờ người chơi?
- **Tóm tắt:** Vấn đề là gì và người chơi cần làm gì?
- **Phần thưởng tiềm năng:** Người chơi có thể nhận được gì?`
  },
  {
    category: 'Thiết kế Cốt truyện',
    title: 'Cấu trúc Cốt truyện Ba hồi',
    description: 'Sử dụng cấu trúc Ba hồi kinh điển để phác thảo một cốt truyện hoàn chỉnh.',
    prompt: `Hãy phác thảo một cốt truyện hoàn chỉnh cho một câu chuyện về [Mô tả ý tưởng chính, vd: một nông dân trẻ khám phá ra mình là người được chọn] bằng cách sử dụng cấu trúc ba hồi.

**Hồi 1: Thiết lập (The Setup)**
- Giới thiệu nhân vật chính và thế giới bình thường của họ.
- Sự kiện kích thích (Inciting Incident) nào đã đẩy nhân vật vào cuộc phiêu lưu?

**Hồi 2: Đối đầu (The Confrontation)**
- Nhân vật phải đối mặt với những thử thách và trở ngại nào?
- Họ gặp gỡ những đồng minh và kẻ thù nào?
- Điểm giữa (Midpoint): Một sự kiện quan trọng xảy ra làm thay đổi mục tiêu hoặc nhận thức của nhân vật.
- Đỉnh điểm của Hồi 2: Nhân vật đối mặt với một thất bại lớn, mọi thứ có vẻ vô vọng.

**Hồi 3: Giải quyết (The Resolution)**
- Nhân vật học được gì từ thất bại và trở lại mạnh mẽ hơn như thế nào?
- Đỉnh điểm cuối cùng (Climax): Trận chiến/cuộc đối đầu cuối cùng diễn ra như thế nào?
- Kết quả: Câu chuyện kết thúc ra sao? Nhân vật và thế giới đã thay đổi như thế nào?`
  },

  // --- Tường thuật & Văn phong (Narration & Style) ---
  {
    category: 'Tường thuật & Văn phong',
    title: 'Mô tả Cảnh quan bằng Năm giác quan',
    description: 'Hướng dẫn AI viết một đoạn văn mô tả sống động bằng cách tập trung vào cả năm giác quan, thay vì chỉ thị giác.',
    prompt: `Hãy viết một đoạn văn mô tả cảnh quan của [Tên địa điểm, vd: một khu chợ ở sa mạc, một khu rừng sau cơn mưa].

Sử dụng cả năm giác quan để làm cho mô tả trở nên sống động:
- **Thị giác:** Quang cảnh trông như thế nào? (Màu sắc, ánh sáng, bóng tối, chuyển động).
- **Thính giác:** Có những âm thanh gì? (Tiếng ồn ào, sự im lặng, tiếng gió, tiếng động vật).
- **Khứu giác:** Có những mùi gì trong không khí? (Mùi đất ẩm, mùi gia vị, mùi hôi thối).
- **Xúc giác:** Cảm giác khi ở đó là gì? (Không khí nóng ẩm, cơn gió lạnh, mặt đất gồ ghề dưới chân).
- **Vị giác:** Có hương vị nào đặc trưng không? (Vị mặn của gió biển, vị kim loại trong không khí).`
  },
  {
    category: 'Tường thuật & Văn phong',
    title: 'Viết một Cảnh hành động Kịch tính',
    description: 'Yêu cầu AI tập trung vào các động từ mạnh, nhịp độ nhanh và các chi tiết cảm giác để tạo ra một cảnh chiến đấu hấp dẫn.',
    prompt: `Hãy viết một cảnh hành động kịch tính mô tả [Nhân vật A] chiến đấu với [Nhân vật B] tại [Địa điểm].

Hãy tuân thủ các nguyên tắc sau:
1.  **Nhịp độ nhanh:** Sử dụng các câu ngắn và động từ mạnh.
2.  **Tập trung vào giác quan:** Mô tả âm thanh của vũ khí va chạm, cảm giác của đòn đánh, mùi máu...
3.  **Mục tiêu rõ ràng:** Mỗi nhân vật đang cố gắng làm gì trong trận chiến này (không chỉ là đánh bại đối thủ)? (Vd: Giành lấy một vật phẩm, bảo vệ ai đó, câu giờ).
4.  **Bước ngoặt:** Tạo ra một khoảnh khắc bất ngờ trong trận đấu làm thay đổi cục diện. (Vd: một người sử dụng một kỹ năng ẩn, môi trường xung quanh sụp đổ).
5.  **Kết thúc:** Kết thúc cảnh chiến đấu một cách dứt khoát hoặc bằng một tình thế căng thẳng.`
  },
  {
    category: 'Tường thuật & Văn phong',
    title: 'Viết Nội tâm Nhân vật',
    description: 'Khám phá suy nghĩ và cảm xúc của nhân vật trong một tình huống cụ thể để tăng chiều sâu cho nhân vật.',
    prompt: `Hãy viết một đoạn văn mô tả dòng suy nghĩ và cảm xúc nội tâm của nhân vật [Tên nhân vật] khi họ đang trải qua [Sự kiện cụ thể, vd: chứng kiến ngôi làng của mình bị phá hủy, khám phá ra một sự thật đau lòng, chuẩn bị cho một trận quyết đấu sinh tử].

Trong đoạn văn, hãy thể hiện:
- **Cảm xúc chính:** Nỗi sợ hãi, tức giận, buồn bã, hay quyết tâm?
- **Suy nghĩ mâu thuẫn:** Họ có đang đấu tranh với những suy nghĩ trái ngược nhau không?
- **Hồi tưởng:** Sự kiện này có gợi lại cho họ một ký ức nào trong quá khứ không?
- **Hy vọng hoặc Tuyệt vọng:** Họ cảm thấy tương lai sẽ ra sao sau sự kiện này?`
  },
  {
    category: 'Tường thuật & Văn phong',
    title: 'Viết một Đoạn hội thoại Sắc bén',
    description: 'Tạo ra một đoạn hội thoại tự nhiên và có mục đích, bộc lộ tính cách và thúc đẩy cốt truyện.',
    prompt: `Hãy viết một đoạn hội thoại giữa [Nhân vật A] và [Nhân vật B].

Bối cảnh: [Mô tả bối cảnh cuộc trò chuyện].

Mục tiêu của đoạn hội thoại này là:
1.  **Mục tiêu của A:** [Nhân vật A muốn đạt được gì qua cuộc nói chuyện này?].
2.  **Mục tiêu của B:** [Nhân vật B muốn đạt được gì qua cuộc nói chuyện này?].
3.  **Tiết lộ một thông tin quan trọng:** [Thông tin cần được tiết lộ].

Đoạn hội thoại phải thể hiện được tính cách của từng nhân vật qua cách họ nói chuyện và phải có một "subtext" (ẩn ý) rõ ràng.`
  },

  // --- Kỹ Thuật Viết Nâng Cao ---
  {
    category: 'Kỹ Thuật Viết Nâng Cao',
    title: 'Sử dụng Điềm báo (Foreshadowing)',
    description: 'Hướng dẫn AI cài cắm các chi tiết nhỏ để báo trước các sự kiện lớn trong tương lai.',
    prompt: `Trong đoạn văn tiếp theo, hãy mô tả [Sự kiện hiện tại]. Đồng thời, hãy cài cắm một chi tiết nhỏ, tinh tế để làm điềm báo cho [Sự kiện tương lai]. Chi tiết này không được quá lộ liễu.

Ví dụ: một vết nứt nhỏ trên thanh kiếm thần, một cơn gió lạnh bất thường, một câu nói bâng quơ của một nhân vật phụ.`
  },
  {
    category: 'Kỹ Thuật Viết Nâng Cao',
    title: 'Tạo Căng thẳng bằng Nhịp điệu',
    description: 'Điều khiển nhịp độ câu văn để xây dựng sự hồi hộp và căng thẳng.',
    prompt: `Hãy viết một đoạn văn mô tả nhân vật [Tên nhân vật] đang [Hành động nguy hiểm, vd: lẻn vào lâu đài địch]. Bắt đầu bằng những câu văn dài, mô tả chi tiết để tạo cảm giác chậm rãi. Khi nhân vật sắp bị phát hiện, hãy chuyển sang các câu văn ngắn, dồn dập, tập trung vào hành động và cảm giác để đẩy cao trào.`
  },
  {
    category: 'Kỹ Thuật Viết Nâng Cao',
    title: 'Kể chuyện không đáng tin cậy (Unreliable Narrator)',
    description: 'Hướng dẫn AI kể chuyện từ góc nhìn của một nhân vật có nhận thức sai lệch hoặc đang che giấu sự thật.',
    prompt: `Hãy kể lại sự kiện [Tên sự kiện] từ góc nhìn của [Tên nhân vật]. Nhân vật này [Mô tả lý do không đáng tin, vd: đang cố che giậy tội lỗi của mình, bị ảo giác, có thành kiến sâu sắc]. Lời kể của họ phải thể hiện sự sai lệch đó, để lại những gợi ý cho người đọc rằng sự thật có thể khác.`
  },
  {
    category: 'Kỹ Thuật Viết Nâng Cao',
    title: 'Sử dụng Biểu tượng (Symbolism)',
    description: 'Yêu cầu AI sử dụng một đối tượng hoặc hình ảnh lặp đi lặp lại để biểu trưng cho một ý tưởng lớn hơn.',
    prompt: `Hãy viết một đoạn văn mô tả [Tình huống]. Trong đoạn văn này, hãy sử dụng hình ảnh của [Đối tượng biểu tượng, vd: một con bướm, một chiếc đồng hồ hỏng, một cơn bão] để biểu trưng cho [Ý tưởng trừu tượng, vd: sự thay đổi, sự mất mát thời gian, sự hỗn loạn nội tâm]. Hãy lặp lại hình ảnh này một cách tự nhiên để tạo ấn tượng.`
  },

  // --- Phong Cách Tác Giả ---
  {
    category: 'Phong Cách Tác Giả',
    title: 'Văn phong Nhĩ Căn',
    description: 'Bắt chước văn phong của Nhĩ Căn, tập trung vào sự bi tráng, cô độc, và những triết lý về số phận.',
    prompt: `Hãy viết một đoạn văn theo phong cách của tác giả Nhĩ Căn, mô tả nhân vật chính đang đối mặt với một lựa chọn sinh tử. Tập trung vào sự cô độc của nhân vật giữa đất trời, sự mênh mông của vũ trụ, và những suy ngẫm về đạo, về ma, về sự tồn tại của bản thân. Sử dụng những câu văn mang tính triết lý và bi tráng.`
  },
  {
    category: 'Phong Cách Tác Giả',
    title: 'Văn phong Cổ Long',
    description: 'Bắt chước văn phong của Cổ Long, với những câu văn ngắn, đoạn hội thoại sắc bén, và không khí lãng tử, bí ẩn.',
    prompt: `Hãy viết một cảnh gặp gỡ giữa hai kiếm khách trong một quán rượu đêm mưa, theo phong cách của Cổ Long. Sử dụng những câu văn ngắn gọn, súc tích. Tập trung vào không khí, ánh mắt, và những câu đối thoại ngắn nhưng đầy ẩn ý. Gió lạnh. Rượu cũng lạnh. Lòng người còn lạnh hơn.`
  },
  {
    category: 'Phong Cách Tác Giả',
    title: 'Văn phong Kim Dung',
    description: 'Bắt chước văn phong của Kim Dung, kết hợp giữa võ thuật, lịch sử, và tình cảm nhân vật một cách hào hùng.',
    prompt: `Hãy viết một đoạn văn theo phong cách của Kim Dung, mô tả một trận tỷ thí võ công trên đỉnh Hoa Sơn. Lồng ghép các chiêu thức võ công có tên gọi mỹ miều, kết hợp với bối cảnh lịch sử và những suy tư nội tâm của nhân vật về quốc gia đại sự và tình cảm cá nhân.`
  },
  {
    category: 'Phong Cách Tác Giả',
    title: 'Văn phong Lovecraft',
    description: 'Bắt chước văn phong của H.P. Lovecraft, tập trung vào sự kinh hoàng không thể diễn tả, sự điên rồ và sự nhỏ bé của con người.',
    prompt: `Hãy viết một đoạn văn theo phong cách của H.P. Lovecraft. Mô tả một nhà nghiên cứu tìm thấy một di vật cổ xưa. Tập trung vào cảm giác bất an, sự sai lệch về hình học của di vật, và cảm giác kinh hoàng khi nhân vật nhận ra một sự thật khủng khiếp về vũ trụ mà trí óc con người không thể chịu đựng nổi.`
  },

  // --- Phát Triển Đa Thể Loại ---
  {
    category: 'Phát Triển Đa Thể Loại',
    title: 'Bối cảnh Kinh dị Vũ trụ (Cosmic Horror)',
    description: 'Xây dựng một bối cảnh kinh dị Lovecraftian, tập trung vào sự nhỏ bé của con người và những thực thể không thể hiểu nổi.',
    prompt: `Tạo ra một bối cảnh cho câu chuyện kinh dị vũ trụ. Mô tả một thị trấn hẻo lánh ven biển tên là [Tên thị trấn]. Người dân ở đây có những tập tục kỳ lạ và luôn sợ hãi một thứ gì đó từ đại dương. Tập trung vào cảm giác bất an, những kiến trúc hình học phi Euclid kỳ dị, và gợi ý về một thực thể cổ xưa, khổng lồ đang ngủ say dưới đáy biển.`
  },
  {
    category: 'Phát Triển Đa Thể Loại',
    title: 'Xây dựng Thế giới Cyberpunk',
    description: 'Thiết kế một thế giới cyberpunk với các yếu tố công nghệ cao, đời sống thấp, và các tập đoàn lớn mạnh.',
    prompt: `Hãy thiết kế một thế giới cyberpunk. Tập trung vào các yếu tố sau:
1.  **Công nghệ thống trị:** Một công nghệ chủ đạo là gì (vd: cấy ghép cybernetic, thực tế ảo toàn diện)?
2.  **Tập đoàn cai trị:** Tên và lĩnh vực hoạt động của tập đoàn lớn nhất thế giới là gì?
3.  **Xung đột xã hội:** Mâu thuẫn chính trong xã hội là gì (vd: người cấy ghép và người thuần túy, sự kiểm soát của tập đoàn)?
4.  **Thế giới ngầm:** Cuộc sống của những người ngoài vòng pháp luật (lính đánh thuê, hacker) diễn ra như thế nào?`
  },
  {
    category: 'Phát Triển Đa Thể Loại',
    title: 'Thiết kế một Kịch bản Hậu tận thế',
    description: 'Tạo ra một bối cảnh hậu tận thế độc đáo, xác định nguyên nhân của thảm họa và các phe phái sống sót.',
    prompt: `Hãy thiết kế một bối cảnh hậu tận thế.

Trả lời các câu hỏi sau:
1.  **Thảm họa:** Điều gì đã gây ra sự sụp đổ của thế giới? (Vd: Đại dịch zombie, chiến tranh hạt nhân, thảm họa môi trường, sự trỗi dậy của AI).
2.  **Thế giới hiện tại:** Thế giới bây giờ trông như thế nào? (Vd: Thành phố đổ nát bị thiên nhiên xâm chiếm, sa mạc phóng xạ rộng lớn).
3.  **Các phe phái sống sót:** Có những nhóm người nào đang tồn tại? (Vd: Những người sống sót trong các khu định cư kiên cố, các băng cướp du mục, những kẻ đột biến).
4.  **Mối nguy hiểm chính:** Ngoài các phe phái khác, mối nguy hiểm lớn nhất trong thế giới này là gì? (Vd: Quái vật đột biến, các khu vực nhiễm độc, thời tiết khắc nghiệt).`
  },
  {
    category: 'Phát Triển Đa Thể Loại',
    title: 'Xây dựng một Cốt truyện Trinh thám',
    description: 'Phác thảo một vụ án bí ẩn với đầy đủ các yếu tố cần thiết cho một câu chuyện trinh thám.',
    prompt: `Hãy phác thảo một cốt truyện trinh thám.

Cung cấp các thông tin sau:
1.  **Vụ án:** Tội ác là gì? (Vd: Một vụ giết người trong phòng kín).
2.  **Nạn nhân:** Nạn nhân là ai và có bí mật gì?
3.  **Nghi phạm:** Tạo ra 3 nghi phạm chính, mỗi người đều có động cơ và cơ hội để gây án.
4.  **Manh mối:** Đưa ra 3 manh mối quan trọng mà thám tử có thể tìm thấy. Một trong số đó nên là một manh mối giả (red herring).
5.  **Lời giải:** Ai là thủ phạm thực sự và họ đã thực hiện vụ án như thế nào?`
  }
];
