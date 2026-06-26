/**
 * Fresh seed — creates a complete tenant + all related data from scratch.
 * Safe to run on an empty database or re-run (upserts everywhere).
 *
 * Usage:  node prisma/seed_fresh.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TENANT_ID   = 'sadat_tenant';
const PLAIN_PASS  = 'Password1';   // used for all accounts

const neighborhoodNames = [
  'المعادي', 'الزمالك', 'مدينة نصر', 'مصر الجديدة', 'المهندسين',
  'الجيزة', 'التجمع الخامس', 'الشروق', '6 أكتوبر', 'الشيخ زايد',
  'المقطم', 'الرحاب', 'الهرم', 'فيصل', 'شبرا',
  'العتبة', 'وسط البلد', 'الدقي', 'المنيل', 'العجوزة', 'حدائق الأهرام',
];

const categoryNames = [
  'مشويات', 'وجبات سريعة', 'مأكولات بحرية', 'حلويات', 'مشروبات',
  'مقبلات', 'سلطات', 'معجنات', 'أطباق رئيسية', 'إفطار',
  'عشاء', 'غداء', 'وجبات خفيفة', 'ساندويتشات', 'بيتزا',
  'برجر', 'مكرونة', 'أرز', 'شوربة', 'عصائر', 'قهوة',
];

const vendorNames = [
  'مطعم الأصالة', 'كافيه النخيل', 'مطعم الفردوس', 'بيتزا الريف', 'مشويات السلطان',
  'حلويات الشام', 'مطعم البحر', 'كافيه الواحة', 'مطعم الزيتون', 'برجر المدينة',
  'مطعم الأندلس', 'كشري أبو طارق', 'فطائر الصباح', 'مطعم الربيع', 'مأكولات بحرية الخليج',
  'مطعم القصر', 'كافيه الحديقة', 'مشاوي العائلة', 'حلويات القاهرة', 'مطعم النيل', 'سناكس الليل',
];

const captainNames = [
  'أحمد السواق', 'محمد الكابتن', 'علي الدليفري', 'حسن الطيار', 'خالد السرعة',
  'سامي التوصيل', 'ياسر الماشي', 'وليد الموتو', 'طارق الدراجة', 'عمر الريح',
  'كريم الأمين', 'ناصر الوفي', 'صلاح السريع', 'فؤاد الماهر', 'رشيد الخبير',
  'جمال النشيط', 'حسين الجاد', 'كامل الأمل', 'فتحي الجديد', 'سعيد الفرحان', 'إبراهيم الكفء',
];

const userNames = [
  'أحمد محمد', 'فاطمة علي', 'محمود حسن', 'نور الدين', 'ليلى سعيد',
  'عمر خالد', 'مريم يوسف', 'كريم أحمد', 'سارة محمود', 'طارق عبدالله',
  'هدى إبراهيم', 'ياسر سالم', 'رنا فؤاد', 'خالد ناصر', 'دينا رشيد',
  'وليد صلاح', 'منى جمال', 'سامي حسين', 'لمى كامل', 'عادل فتحي', 'ندى وليد',
];

const itemNames = [
  'دجاج مشوي', 'كفتة مشوية', 'شاورما لحم', 'شاورما فراخ', 'كبدة إسكندراني',
  'فتة لحم', 'ملوخية بالأرانب', 'محشي ورق عنب', 'كشري مصري', 'فول مدمس',
  'طعمية', 'كباب حلة', 'بيتزا مارجريتا', 'برجر لحم', 'سمك مشوي',
  'جمبري مقلي', 'أرز بالخلطة', 'سلطة يونانية', 'حمص بالطحينة', 'بابا غنوج', 'فطير مشلتت',
];

const descriptions = [
  'طبق شهي ولذيذ', 'وجبة مميزة للعائلة', 'أفضل المكونات الطازجة',
  'طعم أصيل ومميز', 'وصفة تقليدية', 'خيار مثالي للغداء',
  'مناسب لجميع الأوقات', 'طبق غني بالنكهات', 'وجبة صحية ومتوازنة',
  'تحضير يومي طازج', 'نكهة لا تقاوم', 'الأكثر طلباً',
  'خيار العائلة المفضل', 'طعم البيت الأصيل', 'وجبة سريعة ولذيذة',
  'مكونات طبيعية 100%', 'تقديم ساخن ولذيذ', 'طبق مميز للمناسبات',
  'وصفة سرية خاصة', 'الأفضل في المدينة', 'تجربة طعام فريدة',
];

const addresses = [
  'شارع الجمهورية، المعادي', 'شارع النيل، الزمالك', 'شارع الهرم، الجيزة',
  'شارع صلاح سالم، مدينة نصر', 'شارع الثورة، مصر الجديدة', 'شارع التحرير، وسط البلد',
  'شارع الأهرام، فيصل', 'شارع السودان، المهندسين', 'شارع رمسيس، شبرا',
  'شارع الجلاء، العتبة', 'شارع الملك فيصل، الهرم', 'شارع عباس العقاد، مدينة نصر',
  'شارع مصطفى النحاس، مدينة نصر', 'شارع الميرغني، مصر الجديدة', 'شارع البحر الأعظم، الجيزة',
  'شارع الهضبة الوسطى، المقطم', 'شارع التسعين، التجمع الخامس', 'شارع النزهة، مدينة نصر',
  'شارع الطيران، مدينة نصر', 'شارع جامعة الدول، المهندسين', 'شارع الشهيد، المعادي',
];

const orderStatuses = [
  'PENDING', 'COUNTER_OFFER_SENT', 'COUNTER_OFFER_ACCEPTED',
  'ACCEPTED_BY_CAPTAIN', 'DELIVERED', 'REJECTED_BY_VENDOR', 'CANCELLED',
];

const IMAGE_PLACEHOLDER = 'items/air-fryer-whole-chicken-70.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 بدء ملء قاعدة البيانات من الصفر...\n');

  const passwordHash = await bcrypt.hash(PLAIN_PASS, 12);

  // ── 1. Tenant ──────────────────────────────────────────────────────────────
  console.log('🏢 إنشاء المستأجر (Tenant)...');
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id:          TENANT_ID,
      tenantName:  'شركة تعالالي للتوصيل',
      email:       'admin@sadat.com',
      address:     'القاهرة، مصر',
      phoneNumber: '01000000000',
      password:    passwordHash,
    },
  });
  console.log('✅ تم إنشاء المستأجر\n');

  // ── 2. Neighborhoods ───────────────────────────────────────────────────────
  console.log('📍 إنشاء الأحياء...');
  const neighborhoodIds = [];
  for (let i = 0; i < 21; i++) {
    const n = await prisma.neighborhood.upsert({
      where:  { name_tenantId: { name: neighborhoodNames[i], tenantId: TENANT_ID } },
      update: {},
      create: { tenantId: TENANT_ID, name: neighborhoodNames[i] },
    });
    neighborhoodIds.push(n.id);
  }
  console.log(`✅ ${neighborhoodIds.length} حي\n`);

  // ── 3. Categories ──────────────────────────────────────────────────────────
  console.log('🏷️  إنشاء الفئات...');
  const categoryIds = [];
  for (let i = 0; i < 21; i++) {
    const c = await prisma.category.upsert({
      where:  { name_tenantId: { name: categoryNames[i], tenantId: TENANT_ID } },
      update: {},
      create: { tenantId: TENANT_ID, name: categoryNames[i] },
    });
    categoryIds.push(c.id);
  }
  console.log(`✅ ${categoryIds.length} فئة\n`);

  // ── 4. Vendors ─────────────────────────────────────────────────────────────
  console.log('🏪 إنشاء المطاعم...');
  const vendorIds = [];
  for (let i = 0; i < 21; i++) {
    const v = await prisma.vendor.upsert({
      where:  { vendorName_tenantId: { vendorName: vendorNames[i], tenantId: TENANT_ID } },
      update: { isLocked: false },
      create: {
        tenantId:      TENANT_ID,
        vendorName:    vendorNames[i],
        contactNumber: `0110${String(i).padStart(7, '0')}`,
        password:      passwordHash,
        address:       addresses[i],
        longitude:     31.2357 + i * 0.01,
        latitude:      30.0444 + i * 0.01,
        description:   descriptions[i],
        isOpen:        'true',
        isLocked:      false,
        image:         IMAGE_PLACEHOLDER,
        neighborhoodId: neighborhoodIds[i],
      },
    });
    vendorIds.push(v.id);

    // Category link
    await prisma.vendorCategory.upsert({
      where:  { vendorId_categoryId_tenantId: { vendorId: v.id, categoryId: categoryIds[i], tenantId: TENANT_ID } },
      update: {},
      create: { tenantId: TENANT_ID, vendorId: v.id, categoryId: categoryIds[i] },
    });

    // Delivery price for each neighborhood
    await prisma.vendorNeighborhoodPrice.upsert({
      where:  { vendorId_neighborhoodId_tenantId: { vendorId: v.id, neighborhoodId: neighborhoodIds[i], tenantId: TENANT_ID } },
      update: { price: 15 + i * 2 },
      create: { tenantId: TENANT_ID, vendorId: v.id, neighborhoodId: neighborhoodIds[i], price: 15 + i * 2 },
    });
  }
  console.log(`✅ ${vendorIds.length} مطعم\n`);

  // ── 5. Items (3 per vendor) ────────────────────────────────────────────────
  console.log('🍽️  إنشاء الأصناف...');
  let itemCount = 0;
  for (let v = 0; v < vendorIds.length; v++) {
    for (let k = 0; k < 3; k++) {
      const idx = (v * 3 + k) % 21;
      await prisma.item.create({
        data: {
          tenantId:    TENANT_ID,
          name:        `${itemNames[idx]} ${k + 1}`,
          description: descriptions[idx],
          imageLink:   IMAGE_PLACEHOLDER,
          price:       50 + idx * 5,
          vendorId:    vendorIds[v],
          isAvailable: true,
        },
      });
      itemCount++;
    }
  }
  console.log(`✅ ${itemCount} صنف\n`);

  // ── 6. Menus (2 per vendor) ────────────────────────────────────────────────
  console.log('📋 إنشاء قوائم الطعام...');
  let menuCount = 0;
  for (const vid of vendorIds) {
    for (let k = 0; k < 2; k++) {
      await prisma.menu.create({
        data: { tenantId: TENANT_ID, photo: IMAGE_PLACEHOLDER, vendorId: vid },
      });
      menuCount++;
    }
  }
  console.log(`✅ ${menuCount} قائمة\n`);

  // ── 7. Captains ────────────────────────────────────────────────────────────
  console.log('🚗 إنشاء الكباتن...');
  const captainIds = [];
  for (let i = 0; i < 21; i++) {
    const c = await prisma.captain.upsert({
      where:  { userName_tenantId: { userName: captainNames[i], tenantId: TENANT_ID } },
      update: { isLocked: false },
      create: {
        tenantId:                    TENANT_ID,
        userName:                    captainNames[i],
        email:                       `captain${i + 1}@sadat.com`,
        phoneNumber:                 `0120${String(i).padStart(7, '0')}`,
        password:                    passwordHash,
        longitude:                   31.2357 + i * 0.01,
        latitude:                    30.0444 + i * 0.01,
        workingHoursStart:           '08:00',
        workingHoursEnd:             '22:00',
        isAvailable:                 true,
        isLocked:                    false,
        photo:                       IMAGE_PLACEHOLDER,
        nationalId:                  `2${String(i).padStart(13, '0')}`,
        maxCurrentOrders:            3,
        maxEarningsSinceLastActivation: 1000 + i * 50,
      },
    });
    captainIds.push(c.id);
  }
  console.log(`✅ ${captainIds.length} كابتن\n`);

  // ── 8. Users ───────────────────────────────────────────────────────────────
  console.log('👥 إنشاء المستخدمين...');
  const userIds = [];
  for (let i = 0; i < 21; i++) {
    const u = await prisma.user.upsert({
      where:  { userName_tenantId: { userName: userNames[i], tenantId: TENANT_ID } },
      update: {},
      create: {
        tenantId:      TENANT_ID,
        userName:      userNames[i],
        email:         `user${i + 1}@sadat.com`,
        phoneNumber:   `0100${String(i).padStart(7, '0')}`,
        password:      passwordHash,
        address:       addresses[i],
        neighborhoodId: neighborhoodIds[i],
      },
    });
    userIds.push(u.id);
  }
  console.log(`✅ ${userIds.length} مستخدم\n`);

  // ── 9. Orders ──────────────────────────────────────────────────────────────
  console.log('📦 إنشاء الطلبات...');
  const orderIds = [];
  for (let i = 0; i < 21; i++) {
    const status = orderStatuses[i % orderStatuses.length];
    const o = await prisma.order.create({
      data: {
        tenantId:       TENANT_ID,
        userId:         userIds[i],
        captainId:      status === 'ACCEPTED_BY_CAPTAIN' || status === 'DELIVERED'
                          ? captainIds[i]
                          : null,
        vendorId:       vendorIds[i],
        neighborhoodId: neighborhoodIds[i],
        status,
        description:    `طلب رقم ${i + 1} - ${descriptions[i]}`,
        additionalNotes:`ملاحظات إضافية للطلب ${i + 1}`,
        userAddress:    addresses[i],
        userLongitude:  31.2357 + i * 0.01,
        userLatitude:   30.0444 + i * 0.01,
        phoneNumber:    `0100${String(i).padStart(7, '0')}`,
        price:          100 + i * 15,
        deliveryPrice:  20 + i * 2,
        isRated:        i % 3 === 0,
      },
    });
    orderIds.push(o.id);
  }
  console.log(`✅ ${orderIds.length} طلب\n`);

  // ── 10. Order Attachments ─────────────────────────────────────────────────
  console.log('📎 إنشاء مرفقات الطلبات...');
  let attachCount = 0;
  for (let i = 0; i < orderIds.length; i++) {
    await prisma.orderAttachment.create({
      data: { tenantId: TENANT_ID, orderId: orderIds[i], type: 'IMAGE', link: IMAGE_PLACEHOLDER },
    });
    attachCount++;
    if (i % 2 === 0) {
      await prisma.orderAttachment.create({
        data: { tenantId: TENANT_ID, orderId: orderIds[i], type: 'VOICE', link: IMAGE_PLACEHOLDER },
      });
      attachCount++;
    }
  }
  console.log(`✅ ${attachCount} مرفق\n`);

  // ── 11. Complaints ─────────────────────────────────────────────────────────
  console.log('💬 إنشاء الشكاوى...');
  const complainSources = ['USER', 'VENDOR', 'CAPTAIN'];
  for (let i = 0; i < 21; i++) {
    await prisma.complain.create({
      data: {
        tenantId:    TENANT_ID,
        description: `شكوى رقم ${i + 1} - ${descriptions[i]}`,
        type:        complainSources[i % complainSources.length],
        userId:      userIds[i],
        submittedAt: new Date(),
        reply:       i % 3 === 0 ? `رد على الشكوى ${i + 1}` : null,
        repliedAt:   i % 3 === 0 ? new Date() : null,
      },
    });
  }
  console.log('✅ 21 شكوى\n');

  // ── 12. Vendor Complaints ─────────────────────────────────────────────────
  console.log('💬 إنشاء شكاوى المطاعم...');
  for (let i = 0; i < 21; i++) {
    await prisma.vendorComplain.create({
      data: {
        tenantId:    TENANT_ID,
        description: `شكوى مطعم رقم ${i + 1} - ${descriptions[i]}`,
        type:        complainSources[i % complainSources.length],
        vendorId:    vendorIds[i],
        submittedAt: new Date(),
        reply:       i % 4 === 0 ? `رد على شكوى المطعم ${i + 1}` : null,
        repliedAt:   i % 4 === 0 ? new Date() : null,
      },
    });
  }
  console.log('✅ 21 شكوى مطعم\n');

  // ── 13. Captain Requests ──────────────────────────────────────────────────
  console.log('📝 إنشاء طلبات الكباتن...');
  const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  for (let i = 0; i < 21; i++) {
    await prisma.captainRequest.create({
      data: {
        tenantId:    TENANT_ID,
        captainId:   captainIds[i],
        description: `طلب كابتن رقم ${i + 1} - ${descriptions[i]}`,
        status:      requestStatuses[i % requestStatuses.length],
        reply:       i % 2 === 0 ? `رد على طلب الكابتن ${i + 1}` : null,
        submittedAt: new Date(),
        repliedAt:   i % 2 === 0 ? new Date() : null,
      },
    });
  }
  console.log('✅ 21 طلب كابتن\n');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('🎉 تم ملء قاعدة البيانات بنجاح!\n');
  console.log('📊 الإحصائيات:');
  console.log(`   Tenant ID  : ${TENANT_ID}`);
  console.log(`   كلمة المرور: ${PLAIN_PASS}  (لجميع الحسابات)`);
  console.log(`   21 حي | 21 فئة | 21 مطعم | 21 كابتن | 21 مستخدم`);
  console.log(`   ${itemCount} صنف | ${menuCount} قائمة | 21 طلب | ${attachCount} مرفق`);
  console.log(`   21 شكوى مستخدم | 21 شكوى مطعم | 21 طلب كابتن`);
  console.log('\n📋 بيانات تسجيل الدخول:');
  console.log(`   مستخدم مثال  : user1@sadat.com  /  ${PLAIN_PASS}`);
  console.log(`   مطعم مثال    : 01100000000      /  ${PLAIN_PASS}`);
  console.log(`   كابتن مثال   : captain1@sadat.com / ${PLAIN_PASS}`);
  console.log(`   أدمن         : admin@sadat.com  /  ${PLAIN_PASS}  (tenant: ${TENANT_ID})`);
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
