export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'grill' | 'mahshi' | 'casseroles' | 'birds' | 'meals' | 'extra';
}

export const CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'grill', name: '🔥 المشاوي عالفتحم' },
  { id: 'meals', name: '🍱 الوجبات' },
  { id: 'mahshi', name: '🥬 المحاشي' },
  { id: 'casseroles', name: '🥘 الصواني والطواجن' },
  { id: 'birds', name: '🕊️ الطيور' },
  { id: 'extra', name: '🍟 أصناف إضافية' },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- المشاوي عالفتحم ---
  { id: '1', name: 'فرخة كاملة', description: 'جميع المشاوي تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 360, category: 'grill' },
  { id: '2', name: 'نصف فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 195, category: 'grill' },
  { id: '3', name: 'ربع فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 120, category: 'grill' },
  { id: '4', name: 'ك كباب ستيك', description: 'كيلو كباب ستيك مشوي عالفتحم', price: 800, category: 'grill' },
  { id: '5', name: 'نصف كباب ستيك', price: 430, category: 'grill' },
  { id: '6', name: 'ربع كباب ستيك', price: 250, category: 'grill' },
  { id: '7', name: 'ك كفتة بلدي', price: 750, category: 'grill' },
  { id: '8', name: 'نصف كفتة بلدي', price: 400, category: 'grill' },
  { id: '9', name: 'ربع كفتة بلدي', price: 230, category: 'grill' },
  { id: '10', name: 'ك شيش طاووق', price: 400, category: 'grill' },
  { id: '11', name: 'نصف شيش طاووق', price: 220, category: 'grill' },
  { id: '12', name: 'ربع شيش طاووق', price: 130, category: 'grill' },

  // --- الوجبات ---
  { id: '13', name: 'وجبة ربع فرخة مشوي / محمر', description: 'رز + سلطة + طحينة + عيش', price: 120, category: 'meals' },
  { id: '14', name: 'وجبة ربع فراخ بانية بلدي', description: 'رز + سلطة + عيش', price: 130, category: 'meals' },
  { id: '15', name: 'وجبة ربع فراخ بانية بلدي ميكس', description: 'مكرونة بالبشاميل + سلطة + عيش', price: 210, category: 'meals' },
  { id: '16', name: 'وجبة ربع شيش طاووق مشوي', description: 'رز + سلطة + طحينة + عيش', price: 130, category: 'meals' },
  { id: '17', name: 'وجبة ربع كفتة مشوية', description: 'رز + سلطة + طحينة + عيش', price: 230, category: 'meals' },
  { id: '18', name: 'وجبة ربع كفتة بالصلصة', description: 'رز + سلطة + عيش', price: 230, category: 'meals' },
  { id: '19', name: 'وجبة ورقة كبدة بلدي بالخلطة', description: 'رز + سلطة + عيش', price: 230, category: 'meals' },
  { id: '20', name: 'وجبة طاجن مكرونة بالجمبري', description: '200 جرام جمبري فريش + وايت صوص', price: 300, category: 'meals' },

  // --- المحاشي ---
  { id: '21', name: 'ك محشي مشكل', price: 160, category: 'mahshi' },
  { id: '22', name: 'نصف محشي مشكل', price: 90, category: 'mahshi' },
  { id: '23', name: 'ربع محشي مشكل', price: 50, category: 'mahshi' },
  { id: '24', name: 'ك محشي كرنب', price: 180, category: 'mahshi' },
  { id: '25', name: 'نصف محشي كرنب', price: 100, category: 'mahshi' },
  { id: '26', name: 'ربع محشي كرنب', price: 60, category: 'mahshi' },
  { id: '27', name: 'ك محشي ورق عنب', price: 200, category: 'mahshi' },
  { id: '28', name: 'نصف محشي ورق عنب', price: 110, category: 'mahshi' },
  { id: '29', name: 'ربع محشي ورق عنب', price: 65, category: 'mahshi' },
  { id: '30', name: 'ك محشي ممبار', price: 260, category: 'mahshi' },
  { id: '31', name: 'نصف محشي ممبار', price: 140, category: 'mahshi' },
  { id: '32', name: 'ربع محشي ممبار', price: 80, category: 'mahshi' },

  // --- الصواني والطواجن ---
  { id: '33', name: 'صينية مكرونة بالبشاميل', price: 300, category: 'casseroles' },
  { id: '34', name: 'صينية جلاش باللحمة', price: 250, category: 'casseroles' },
  { id: '35', name: 'صينية بطاطس بالفراخ', price: 400, category: 'casseroles' },
  { id: '36', name: 'صينية بطاطس باللحمة', price: 430, category: 'casseroles' },
  { id: '37', name: 'طاجن مكرونة بالبشاميل', price: 100, category: 'casseroles' },
  { id: '38', name: 'طاجن لحمة بالبصل', price: 330, category: 'casseroles' },
  { id: '39', name: 'طاجن بامية باللحمة', price: 310, category: 'casseroles' },
  { id: '40', name: 'طاجن فريك باللحمة', price: 310, category: 'casseroles' },
  { id: '41', name: 'طاجن بطاطس باللحمة', price: 290, category: 'casseroles' },

  // --- الطيور ---
  { id: '42', name: 'فرد حمام محشي فريك', price: 240, category: 'birds' },
  { id: '43', name: 'فرد حمام محشي رز', price: 230, category: 'birds' },
  { id: '44', name: 'جوز حمام محشي فريك / رز', price: 450, category: 'birds' },
  { id: '45', name: 'بطه محشي فريك', price: 730, category: 'birds' },
  { id: '46', name: 'بطه محشي رز', price: 700, category: 'birds' },
  { id: '47', name: 'بطه محشي ورق عنب', price: 780, category: 'birds' },
  { id: '48', name: 'فرخة مسلوق محمر', price: 330, category: 'birds' },
  { id: '49', name: 'نصف فرخة مسلوق محمر', price: 170, category: 'birds' },
  { id: '50', name: 'ربع فرخة مسلوق محمر', price: 95, category: 'birds' },

  // --- أصناف إضافية ---
  { id: '51', name: 'بانية بلدي مقلي 1 ك', price: 400, category: 'extra' },
  { id: '52', name: 'نصف بانية بلدي مقلي', price: 220, category: 'extra' },
  { id: '53', name: 'حواوشي بلدي', description: 'سلطة + طحينة', price: 90, category: 'extra' },
  { id: '54', name: 'فريك خضار سادة', price: 70, category: 'extra' },
  { id: '55', name: 'بامية خضار سادة', price: 70, category: 'extra' },
  { id: '56', name: 'بطاطس خضار سادة', price: 60, category: 'extra' },
  { id: '57', name: 'ملوخية خضرا', price: 60, category: 'extra' },
  { id: '58', name: 'شوربة لسان عصفور', price: 25, category: 'extra' },
  { id: '59', name: 'شوربة خضار', price: 30, category: 'extra' },
  { id: '60', name: 'بطاطس بوم فريت', price: 40, category: 'extra' },
  { id: '61', name: 'رز بسمتي', price: 35, category: 'extra' },
  { id: '62', name: 'رز بالشعرية', price: 25, category: 'extra' },
];