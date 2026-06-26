const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const TENANT_ID = 'string';
const EXISTING_USER_PHONE = '012879859501';
const EXISTING_VENDOR_ID = 42;
const EXISTING_CAPTAIN_ID = 43;

// Arabic names and data
const arabicUserNames = [
  'أحمد محمد', 'فاطمة علي', 'محمود حسن', 'نور الدين', 'ليلى سعيد',
  'عمر خالد', 'مريم يوسف', 'كريم أحمد', 'سارة محمود', 'طارق عبدالله',
  'هدى إبراهيم', 'ياسر سالم', 'رنا فؤاد', 'خالد ناصر', 'دينا رشيد',
  'وليد صلاح', 'منى جمال', 'سامي حسين', 'لمى كامل', 'عادل فتحي', 'ندى وليد'
];

const arabicVendorNames = [
  'مطعم الأصالة', 'كافيه النخيل', 'مطعم الفردوس', 'بيتزا الريف', 'مشويات السلطان',
  'حلويات الشام', 'مطعم البحر', 'كافيه الواحة', 'مطعم الزيتون', 'برجر المدينة',
  'مطعم الأندلس', 'كشري أبو طارق', 'فطائر الصباح', 'مطعم الربيع', 'مأكولات بحرية الخليج',
  'مطعم القصر', 'كافيه الحديقة', 'مشاوي العائلة', 'حلويات القاهرة', 'مطعم النيل', 'سناكس الليل'
];

const arabicCaptainNames = [
  'كابتن أحمد', 'كابتن محمد', 'كابتن علي', 'كابتن حسن', 'كابتن خالد',
  'كابتن سامي', 'كابتن ياسر', 'كابتن وليد', 'كابتن طارق', 'كابتن عمر',
  'كابتن كريم', 'كابتن ناصر', 'كابتن صلاح', 'كابتن فؤاد', 'كابتن رشيد',
  'كابتن جمال', 'كابتن حسين', 'كابتن كامل', 'كابتن فتحي', 'كابتن سعيد', 'كابتن إبراهيم'
];

const arabicAddresses = [
  'شارع الجمهورية، المعادي', 'شارع النيل، الزمالك', 'شارع الهرم، الجيزة',
  'شارع صلاح سالم، مدينة نصر', 'شارع الثورة، مصر الجديدة', 'شارع التحرير، وسط البلد',
  'شارع الأهرام، فيصل', 'شارع السودان، المهندسين', 'شارع رمسيس، شبرا',
  'شارع الجلاء، العتبة', 'شارع الملك فيصل، الهرم', 'شارع عباس العقاد، مدينة نصر',
  'شارع مصطفى النحاس، مدينة نصر', 'شارع الميرغني، مصر الجديدة', 'شارع البحر الأعظم، الجيزة',
  'شارع الهضبة الوسطى، المقطم', 'شارع التسعين، التجمع الخامس', 'شارع النزهة، مدينة نصر',
  'شارع الطيران، مدينة نصر', 'شارع جامعة الدول، المهندسين', 'شارع الشهيد، المعادي'
];

const arabicItemNames = [
  'دجاج مشوي', 'كفتة مشوية', 'شاورما لحم', 'شاورما فراخ', 'كبدة إسكندراني',
  'فتة لحم', 'ملوخية بالأرانب', 'محشي ورق عنب', 'كشري مصري', 'فول مدمس',
  'طعمية', 'كباب حلة', 'بيتزا مارجريتا', 'برجر لحم', 'سمك مشوي',
  'جمبري مقلي', 'أرز بالخلطة', 'سلطة يونانية', 'حمص بالطحينة', 'بابا غنوج', 'فطير مشلتت'
];

const arabicDescriptions = [
  'طبق شهي ولذيذ', 'وجبة مميزة للعائلة', 'أفضل المكونات الطازجة',
  'طعم أصيل ومميز', 'وصفة تقليدية', 'خيار مثالي للغداء',
  'مناسب لجميع الأوقات', 'طبق غني بالنكهات', 'وجبة صحية ومتوازنة',
  'تحضير يومي طازج', 'نكهة لا تقاوم', 'الأكثر طلباً',
  'خيار العائلة المفضل', 'طعم البيت الأصيل', 'وجبة سريعة ولذيذة',
  'مكونات طبيعية 100%', 'تقديم ساخن ولذيذ', 'طبق مميز للمناسبات',
  'وصفة سرية خاصة', 'الأفضل في المدينة', 'تجربة طعام فريدة'
];

const neighborhoodNames = [
  'المعادي', 'الزمالك', 'مدينة نصر', 'مصر الجديدة', 'المهندسين',
  'الجيزة', 'التجمع الخامس', 'الشروق', '6 أكتوبر', 'الشيخ زايد',
  'المقطم', 'الرحاب', 'الهرم', 'فيصل', 'شبرا',
  'العتبة', 'وسط البلد', 'الدقي', 'المنيل', 'العجوزة', 'حدائق الأهرام'
];

const categoryNames = [
  'مشويات', 'وجبات سريعة', 'مأكولات بحرية', 'حلويات', 'مشروبات',
  'مقبلات', 'سلطات', 'معجنات', 'أطباق رئيسية', 'إفطار',
  'عشاء', 'غداء', 'وجبات خفيفة', 'ساندويتشات', 'بيتزا',
  'برجر', 'مكرونة', 'أرز', 'شوربة', 'عصائر', 'قهوة'
];

async function main() {
  try {
    console.log('🚀 بدء ملء قاعدة البيانات...\n');

    // Get existing user's password hash
    const userResult = await prisma.$queryRaw`
      SELECT password FROM users WHERE phone_number = ${EXISTING_USER_PHONE} AND tenant_id = ${TENANT_ID}
    `;

    if (userResult.length === 0) {
      throw new Error('المستخدم الحالي غير موجود');
    }

    const PASSWORD_HASH = userResult[0].password;
    console.log('✅ تم الحصول على كلمة المرور المشفرة\n');

    // 1. Create 21 Neighborhoods (upsert)
    console.log('📍 إنشاء الأحياء...');
    const neighborhoodIds = [];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO neighborhoods (tenant_id, name, created_at, updated_at) 
        VALUES (${TENANT_ID}, ${neighborhoodNames[i]}, NOW(), NOW()) 
        ON CONFLICT (name, tenant_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `;
      neighborhoodIds.push(result[0].id);
    }
    console.log(`✅ تم إنشاء/تحديث ${neighborhoodIds.length} حي\n`);

    // 2. Create 21 Categories (upsert)
    console.log('🏷️  إنشاء الفئات...');
    const categoryIds = [];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO categories (tenant_id, name) 
        VALUES (${TENANT_ID}, ${categoryNames[i]}) 
        ON CONFLICT (name, tenant_id) DO NOTHING
        RETURNING id
      `;
      
      // If conflict, get the existing ID
      if (result.length === 0) {
        const existing = await prisma.$queryRaw`
          SELECT id FROM categories WHERE name = ${categoryNames[i]} AND tenant_id = ${TENANT_ID}
        `;
        categoryIds.push(existing[0].id);
      } else {
        categoryIds.push(result[0].id);
      }
    }
    console.log(`✅ تم إنشاء/العثور على ${categoryIds.length} فئة\n`);

    // 3. Create 21 new Vendors (upsert - unlocked)
    console.log('🏪 إنشاء المطاعم...');
    const vendorIds = [];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO vendors (
          tenant_id, vendor_name, contact_number, password, address, 
          longitude, latitude, description, is_open, is_locked, 
          image, neighborhood_id
        ) VALUES (
          ${TENANT_ID}, ${arabicVendorNames[i]}, ${`0128${String(i).padStart(7, '0')}`}, 
          ${PASSWORD_HASH}, ${arabicAddresses[i]}, ${31.2357 + (i * 0.01)}, 
          ${30.0444 + (i * 0.01)}, ${arabicDescriptions[i]}, ${'true'}, 
          ${false}, ${'items/air-fryer-whole-chicken-70.jpg'}, ${neighborhoodIds[i]}
        ) 
        ON CONFLICT (vendor_name, tenant_id) DO UPDATE SET is_locked = false
        RETURNING id
      `;
      vendorIds.push(result[0].id);

      // Create vendor category (ignore if exists)
      await prisma.$executeRaw`
        INSERT INTO vendor_categories (tenant_id, vendor_id, category_id) 
        VALUES (${TENANT_ID}, ${vendorIds[i]}, ${categoryIds[i]})
        ON CONFLICT (vendor_id, category_id, tenant_id) DO NOTHING
      `;

      // Create vendor neighborhood price (upsert)
      await prisma.$executeRaw`
        INSERT INTO vendor_neighborhood_prices (tenant_id, vendor_id, neighborhood_id, price, created_at, updated_at) 
        VALUES (${TENANT_ID}, ${vendorIds[i]}, ${neighborhoodIds[i]}, ${15 + (i * 2)}, NOW(), NOW())
        ON CONFLICT (vendor_id, neighborhood_id, tenant_id) DO UPDATE SET price = ${15 + (i * 2)}, updated_at = NOW()
      `;
    }
    console.log(`✅ تم إنشاء/تحديث ${vendorIds.length} مطعم\n`);

    // 4. Create 21 new Captains (upsert - unlocked)
    console.log('🚗 إنشاء الكباتن...');
    const captainIds = [];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO captains (
          tenant_id, user_name, email, phone_number, password, 
          longitude, latitude, working_hours_start, working_hours_end, 
          is_available, is_locked, photo, national_id, max_current_orders, 
          max_earnings_since_last_activation, created_at, updated_at
        ) VALUES (
          ${TENANT_ID}, ${arabicCaptainNames[i]}, ${`captain${i + 1}@example.com`}, 
          ${`0129${String(i).padStart(7, '0')}`}, ${PASSWORD_HASH}, 
          ${31.2357 + (i * 0.01)}, ${30.0444 + (i * 0.01)}, ${'08:00'}, ${'22:00'}, 
          ${true}, ${false}, ${'items/air-fryer-whole-chicken-70.jpg'}, 
          ${`2${String(i).padStart(13, '0')}`}, ${3}, ${1000 + (i * 50)}, NOW(), NOW()
        ) 
        ON CONFLICT (user_name, tenant_id) DO UPDATE SET is_locked = false, updated_at = NOW()
        RETURNING id
      `;
      captainIds.push(result[0].id);
    }
    console.log(`✅ تم إنشاء/تحديث ${captainIds.length} كابتن\n`);

    // 5. Create 21 Users (upsert)
    console.log('👥 إنشاء المستخدمين...');
    const userIds = [];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO users (
          tenant_id, user_name, email, phone_number, password, 
          address, neighborhood_id, created_at, updated_at
        ) VALUES (
          ${TENANT_ID}, ${arabicUserNames[i]}, ${`user${i + 1}@example.com`}, 
          ${`0100${String(i).padStart(7, '0')}`}, ${PASSWORD_HASH}, 
          ${arabicAddresses[i]}, ${neighborhoodIds[i]}, NOW(), NOW()
        ) 
        ON CONFLICT (user_name, tenant_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `;
      userIds.push(result[0].id);
    }
    console.log(`✅ تم إنشاء/تحديث ${userIds.length} مستخدم\n`);

    // 6. Create 21 Items for existing vendor (ID 42)
    console.log('🍽️  إنشاء الأصناف للمطعم الحالي...');
    for (let i = 0; i < 21; i++) {
      await prisma.$executeRaw`
        INSERT INTO items (tenant_id, name, description, image_link, price, vendor_id, is_available) 
        VALUES (
          ${TENANT_ID}, ${arabicItemNames[i]}, ${arabicDescriptions[i]}, 
          ${'items/air-fryer-whole-chicken-70.jpg'}, ${50 + (i * 10)}, 
          ${EXISTING_VENDOR_ID}, ${true}
        )
      `;
    }
    console.log('✅ تم إنشاء 21 صنف للمطعم الحالي\n');

    // 7. Create 1 Item for each new vendor
    console.log('🍽️  إنشاء صنف لكل مطعم جديد...');
    for (let i = 0; i < vendorIds.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO items (tenant_id, name, description, image_link, price, vendor_id, is_available) 
        VALUES (
          ${TENANT_ID}, ${arabicItemNames[i]}, ${arabicDescriptions[i]}, 
          ${'items/air-fryer-whole-chicken-70.jpg'}, ${60 + (i * 8)}, 
          ${vendorIds[i]}, ${true}
        )
      `;
    }
    console.log('✅ تم إنشاء صنف لكل مطعم جديد\n');

    // 8. Create 21 Menus for existing vendor
    console.log('📋 إنشاء قوائم الطعام...');
    for (let i = 0; i < 21; i++) {
      await prisma.$executeRaw`
        INSERT INTO menus (tenant_id, photo, vendor_id) 
        VALUES (${TENANT_ID}, ${'items/air-fryer-whole-chicken-70.jpg'}, ${EXISTING_VENDOR_ID})
      `;
    }
    console.log('✅ تم إنشاء 21 قائمة طعام\n');

    // Get existing user ID
    const existingUserResult = await prisma.$queryRaw`
      SELECT id FROM users WHERE phone_number = ${EXISTING_USER_PHONE} AND tenant_id = ${TENANT_ID}
    `;
    const existingUserId = existingUserResult[0].id;

    // 9. Create 21 Orders for existing user
    console.log('📦 إنشاء طلبات للمستخدم الحالي...');
    const orderStatuses = ['PENDING', 'COUNTER_OFFER_SENT', 'COUNTER_OFFER_ACCEPTED', 'ACCEPTED_BY_CAPTAIN', 'DELIVERED'];
    for (let i = 0; i < 21; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO orders (
          tenant_id, user_id, captain_id, vendor_id, neighborhood_id, 
          status, description, additional_notes, user_address, 
          user_longitude, user_latitude, phone_number, price, 
          delivery_price, is_rated, created_at
        ) VALUES (
          ${TENANT_ID}, ${existingUserId}, 
          ${i < captainIds.length ? captainIds[i] : EXISTING_CAPTAIN_ID}, 
          ${i < vendorIds.length ? vendorIds[i] : EXISTING_VENDOR_ID}, 
          ${neighborhoodIds[i]}, ${orderStatuses[i % orderStatuses.length]}, 
          ${`طلب رقم ${i + 1} - ${arabicDescriptions[i]}`}, 
          ${`ملاحظات إضافية للطلب ${i + 1}`}, ${arabicAddresses[i]}, 
          ${31.2357 + (i * 0.01)}, ${30.0444 + (i * 0.01)}, 
          ${EXISTING_USER_PHONE}, ${100 + (i * 15)}, ${20 + (i * 2)}, 
          ${i % 3 === 0}, NOW()
        ) 
        RETURNING id
      `;

      // Create order attachments
      await prisma.$executeRaw`
        INSERT INTO order_attachments (tenant_id, order_id, type, link, created_at) 
        VALUES (${TENANT_ID}, ${result[0].id}, ${'IMAGE'}, ${'items/air-fryer-whole-chicken-70.jpg'}, NOW())
      `;

      if (i % 2 === 0) {
        await prisma.$executeRaw`
          INSERT INTO order_attachments (tenant_id, order_id, type, link, created_at) 
          VALUES (${TENANT_ID}, ${result[0].id}, ${'VOICE'}, ${'items/air-fryer-whole-chicken-70.jpg'}, NOW())
        `;
      }
    }
    console.log('✅ تم إنشاء 21 طلب للمستخدم الحالي\n');

    // 10. Create 1 Order for each new user
    console.log('📦 إنشاء طلب لكل مستخدم جديد...');
    for (let i = 0; i < userIds.length; i++) {
      const result = await prisma.$queryRaw`
        INSERT INTO orders (
          tenant_id, user_id, captain_id, vendor_id, neighborhood_id, 
          status, description, additional_notes, user_address, 
          user_longitude, user_latitude, phone_number, price, 
          delivery_price, is_rated, created_at
        ) VALUES (
          ${TENANT_ID}, ${userIds[i]}, ${captainIds[i]}, 
          ${i < vendorIds.length ? vendorIds[i] : EXISTING_VENDOR_ID}, 
          ${neighborhoodIds[i]}, ${orderStatuses[i % orderStatuses.length]}, 
          ${`طلب ${arabicUserNames[i]} - ${arabicDescriptions[i]}`}, 
          ${`ملاحظات ${arabicUserNames[i]}`}, ${arabicAddresses[i]}, 
          ${31.2357 + (i * 0.01)}, ${30.0444 + (i * 0.01)}, 
          ${`0100${String(i).padStart(7, '0')}`}, ${120 + (i * 20)}, 
          ${25 + (i * 1.5)}, ${i % 4 === 0}, NOW()
        ) 
        RETURNING id
      `;

      await prisma.$executeRaw`
        INSERT INTO order_attachments (tenant_id, order_id, type, link, created_at) 
        VALUES (${TENANT_ID}, ${result[0].id}, ${'IMAGE'}, ${'items/air-fryer-whole-chicken-70.jpg'}, NOW())
      `;
    }
    console.log('✅ تم إنشاء طلب لكل مستخدم جديد\n');

    // 11. Create 21 Complains
    console.log('💬 إنشاء الشكاوى...');
    const complainSources = ['USER', 'VENDOR', 'CAPTAIN'];
    for (let i = 0; i < 21; i++) {
      await prisma.$executeRaw`
        INSERT INTO complains (tenant_id, description, type, user_id, submitted_at, reply, replied_at) 
        VALUES (
          ${TENANT_ID}, ${`شكوى رقم ${i + 1} - ${arabicDescriptions[i]}`}, 
          ${complainSources[i % complainSources.length]}, 
          ${i < userIds.length ? userIds[i] : existingUserId}, NOW(), 
          ${i % 3 === 0 ? `رد على الشكوى ${i + 1}` : null}, 
          ${i % 3 === 0 ? new Date() : null}
        )
      `;
    }
    console.log('✅ تم إنشاء 21 شكوى\n');

    // 12. Create 21 Captain Requests
    console.log('📝 إنشاء طلبات الكباتن...');
    const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    for (let i = 0; i < 21; i++) {
      await prisma.$executeRaw`
        INSERT INTO captain_requests (tenant_id, captain_id, description, status, reply, submitted_at, replied_at) 
        VALUES (
          ${TENANT_ID}, ${i < captainIds.length ? captainIds[i] : EXISTING_CAPTAIN_ID}, 
          ${`طلب كابتن رقم ${i + 1} - ${arabicDescriptions[i]}`}, 
          ${requestStatuses[i % requestStatuses.length]}, 
          ${i % 2 === 0 ? `رد على طلب الكابتن ${i + 1}` : null}, NOW(), 
          ${i % 2 === 0 ? new Date() : null}
        )
      `;
    }
    console.log('✅ تم إنشاء 21 طلب كابتن\n');

    console.log('\n🎉 تم ملء قاعدة البيانات بنجاح!');
    console.log('📊 الإحصائيات النهائية:');
    console.log(`   - 21 حي`);
    console.log(`   - 21 فئة`);
    console.log(`   - 21 مطعم جديد`);
    console.log(`   - 21 كابتن جديد`);
    console.log(`   - 21 مستخدم جديد`);
    console.log(`   - 21 صنف للمطعم الحالي + 21 صنف للمطاعم الجديدة`);
    console.log(`   - 21 قائمة طعام`);
    console.log(`   - 42 طلب (21 للمستخدم الحالي + 21 للمستخدمين الجدد)`);
    console.log(`   - 21 شكوى`);
    console.log(`   - 21 طلب كابتن`);

  } catch (error) {
    console.error('❌ خطأ في ملء قاعدة البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });