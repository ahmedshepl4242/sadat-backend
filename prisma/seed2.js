const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const TENANT_ID = 'string';
const EXISTING_USER_PHONE = '012879859501';
const EXISTING_VENDOR_ID = 42n;
const EXISTING_CAPTAIN_ID = 43n;

const arabicUserNames = [
  'أحمد محمد', 'فاطمة علي', 'محمود حسن', 'نور الدين', 'ليلى سعيد',
  'عمر خالد', 'مريم يوسف', 'كريم أحمد', 'سارة محمود', 'طارق عبدالله',
  'هدى إبراهيم', 'ياسر سالم', 'رنا فؤاد', 'خالد ناصر', 'دينا رشيد',
  'وليد صلاح', 'منى جمال', 'سامي حسين', 'لمى كامل', 'عادل فتحي', 'ندى وليد'
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

async function main() {
  try {
    console.log('🚀 بدء ملء البيانات المتبقية...\n');

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        phoneNumber_tenantId: {
          phoneNumber: EXISTING_USER_PHONE,
          tenantId: TENANT_ID
        }
      }
    });

    if (!existingUser) {
      throw new Error('المستخدم الحالي غير موجود');
    }

    console.log('✅ تم العثور على المستخدم الحالي\n');

    // Get all users created
    const allUsers = await prisma.user.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    // Get all captains
    const allCaptains = await prisma.captain.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    // Get all orders
    const allOrders = await prisma.order.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    console.log(`📊 البيانات الموجودة:`);
    console.log(`   - ${allUsers.length} مستخدم`);
    console.log(`   - ${allCaptains.length} كابتن`);
    console.log(`   - ${allOrders.length} طلب\n`);

    // 1. Create Order Attachments for existing orders
    console.log('📎 إنشاء مرفقات الطلبات...');
    let attachmentCount = 0;
    
    for (let i = 0; i < Math.min(21, allOrders.length); i++) {
      const order = allOrders[i];
      
      // Check if attachment already exists
      const existingAttachment = await prisma.orderAttachment.findFirst({
        where: {
          orderId: order.id,
          tenantId: TENANT_ID
        }
      });

      if (!existingAttachment) {
        // Create IMAGE attachment
        await prisma.orderAttachment.create({
          data: {
            tenantId: TENANT_ID,
            orderId: order.id,
            type: 'IMAGE',
            link: 'items/air-fryer-whole-chicken-70.jpg'
          }
        });
        attachmentCount++;

        // Create VOICE attachment for even orders
        if (i % 2 === 0) {
          await prisma.orderAttachment.create({
            data: {
              tenantId: TENANT_ID,
              orderId: order.id,
              type: 'VOICE',
              link: 'items/air-fryer-whole-chicken-70.jpg'
            }
          });
          attachmentCount++;
        }
      }
    }
    console.log(`✅ تم إنشاء ${attachmentCount} مرفق للطلبات\n`);

    // 2. Create 21 Complains
    console.log('💬 إنشاء الشكاوى...');
    const complainSources = ['USER', 'VENDOR', 'CAPTAIN'];
    let complainCount = 0;

    for (let i = 0; i < 21; i++) {
      const userId = i < allUsers.length ? allUsers[i].id : existingUser.id;
      
      await prisma.complain.create({
        data: {
          tenantId: TENANT_ID,
          description: `شكوى رقم ${i + 1} - ${arabicDescriptions[i]}`,
          type: complainSources[i % complainSources.length],
          userId: userId,
          submittedAt: new Date(),
          reply: i % 3 === 0 ? `رد على الشكوى ${i + 1}` : null,
          repliedAt: i % 3 === 0 ? new Date() : null
        }
      });
      complainCount++;
    }
    console.log(`✅ تم إنشاء ${complainCount} شكوى\n`);

    // 3. Create 21 Captain Requests
    console.log('📝 إنشاء طلبات الكباتن...');
    const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    let requestCount = 0;

    for (let i = 0; i < 21; i++) {
      const captainId = i < allCaptains.length ? allCaptains[i].id : EXISTING_CAPTAIN_ID;
      
      await prisma.captainRequest.create({
        data: {
          tenantId: TENANT_ID,
          captainId: captainId,
          description: `طلب كابتن رقم ${i + 1} - ${arabicDescriptions[i]}`,
          status: requestStatuses[i % requestStatuses.length],
          reply: i % 2 === 0 ? `رد على طلب الكابتن ${i + 1}` : null,
          submittedAt: new Date(),
          repliedAt: i % 2 === 0 ? new Date() : null
        }
      });
      requestCount++;
    }
    console.log(`✅ تم إنشاء ${requestCount} طلب كابتن\n`);

    console.log('\n🎉 تم ملء البيانات المتبقية بنجاح!');
    console.log('📊 الإحصائيات النهائية:');
    console.log(`   - ${attachmentCount} مرفق للطلبات`);
    console.log(`   - ${complainCount} شكوى`);
    console.log(`   - ${requestCount} طلب كابتن`);

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