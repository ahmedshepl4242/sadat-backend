const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const TENANT_ID = 'string';

async function removeDuplicates() {
  try {
    console.log('🚀 بدء إزالة التكرارات...\n');

    // 1. Remove duplicate Items (by name)
    console.log('🍽️  إزالة الأصناف المكررة...');
    const items = await prisma.item.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const itemsSeen = new Map();
    const itemsToDelete = [];

    for (const item of items) {
      const key = `${item.name}_${item.vendorId}`;
      if (itemsSeen.has(key)) {
        itemsToDelete.push(item.id);
      } else {
        itemsSeen.set(key, item.id);
      }
    }

    if (itemsToDelete.length > 0) {
      await prisma.item.deleteMany({
        where: {
          id: { in: itemsToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${itemsToDelete.length} صنف مكرر\n`);
    } else {
      console.log('✅ لا توجد أصناف مكررة\n');
    }

    // 2. Remove duplicate Categories (by name)
    console.log('🏷️  إزالة الفئات المكررة...');
    const categories = await prisma.category.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const categoriesSeen = new Map();
    const categoriesToDelete = [];

    for (const category of categories) {
      if (categoriesSeen.has(category.name)) {
        categoriesToDelete.push(category.id);
      } else {
        categoriesSeen.set(category.name, category.id);
      }
    }

    if (categoriesToDelete.length > 0) {
      // First, update vendor_categories to point to the first occurrence
      for (const catId of categoriesToDelete) {
        const categoryName = categories.find(c => c.id === catId).name;
        const keepCategoryId = categoriesSeen.get(categoryName);
        
        // Update vendor_categories
        await prisma.$executeRaw`
          UPDATE vendor_categories 
          SET category_id = ${keepCategoryId} 
          WHERE category_id = ${catId} AND tenant_id = ${TENANT_ID}
        `;
      }

      await prisma.category.deleteMany({
        where: {
          id: { in: categoriesToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${categoriesToDelete.length} فئة مكررة\n`);
    } else {
      console.log('✅ لا توجد فئات مكررة\n');
    }

    // 3. Remove duplicate Neighborhoods (by name)
    console.log('📍 إزالة الأحياء المكررة...');
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const neighborhoodsSeen = new Map();
    const neighborhoodsToDelete = [];

    for (const neighborhood of neighborhoods) {
      if (neighborhoodsSeen.has(neighborhood.name)) {
        neighborhoodsToDelete.push(neighborhood.id);
      } else {
        neighborhoodsSeen.set(neighborhood.name, neighborhood.id);
      }
    }

    if (neighborhoodsToDelete.length > 0) {
      // Update references before deleting
      for (const neighId of neighborhoodsToDelete) {
        const neighborhoodName = neighborhoods.find(n => n.id === neighId).name;
        const keepNeighborhoodId = neighborhoodsSeen.get(neighborhoodName);
        
        // Update users
        await prisma.$executeRaw`
          UPDATE users 
          SET neighborhood_id = ${keepNeighborhoodId} 
          WHERE neighborhood_id = ${neighId} AND tenant_id = ${TENANT_ID}
        `;

        // Update vendors
        await prisma.$executeRaw`
          UPDATE vendors 
          SET neighborhood_id = ${keepNeighborhoodId} 
          WHERE neighborhood_id = ${neighId} AND tenant_id = ${TENANT_ID}
        `;

        // Update orders
        await prisma.$executeRaw`
          UPDATE orders 
          SET neighborhood_id = ${keepNeighborhoodId} 
          WHERE neighborhood_id = ${neighId} AND tenant_id = ${TENANT_ID}
        `;

        // Update vendor_neighborhood_prices
        await prisma.$executeRaw`
          UPDATE vendor_neighborhood_prices 
          SET neighborhood_id = ${keepNeighborhoodId} 
          WHERE neighborhood_id = ${neighId} AND tenant_id = ${TENANT_ID}
        `;
      }

      await prisma.neighborhood.deleteMany({
        where: {
          id: { in: neighborhoodsToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${neighborhoodsToDelete.length} حي مكرر\n`);
    } else {
      console.log('✅ لا توجد أحياء مكررة\n');
    }

    // 4. Remove duplicate Vendors (by vendor_name)
    console.log('🏪 إزالة المطاعم المكررة...');
    const vendors = await prisma.vendor.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const vendorsSeen = new Map();
    const vendorsToDelete = [];

    for (const vendor of vendors) {
      if (vendorsSeen.has(vendor.vendorName)) {
        vendorsToDelete.push(vendor.id);
      } else {
        vendorsSeen.set(vendor.vendorName, vendor.id);
      }
    }

    if (vendorsToDelete.length > 0) {
      // Delete related data first (cascade will handle most, but let's be explicit)
      await prisma.item.deleteMany({
        where: {
          vendorId: { in: vendorsToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.menu.deleteMany({
        where: {
          vendorId: { in: vendorsToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.vendorCategory.deleteMany({
        where: {
          vendorId: { in: vendorsToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.vendorNeighborhoodPrice.deleteMany({
        where: {
          vendorId: { in: vendorsToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.vendor.deleteMany({
        where: {
          id: { in: vendorsToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${vendorsToDelete.length} مطعم مكرر\n`);
    } else {
      console.log('✅ لا توجد مطاعم مكررة\n');
    }

    // 5. Remove duplicate Captains (by user_name)
    console.log('🚗 إزالة الكباتن المكررة...');
    const captains = await prisma.captain.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const captainsSeen = new Map();
    const captainsToDelete = [];

    for (const captain of captains) {
      if (captainsSeen.has(captain.userName)) {
        captainsToDelete.push(captain.id);
      } else {
        captainsSeen.set(captain.userName, captain.id);
      }
    }

    if (captainsToDelete.length > 0) {
      await prisma.captainRequest.deleteMany({
        where: {
          captainId: { in: captainsToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.captain.deleteMany({
        where: {
          id: { in: captainsToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${captainsToDelete.length} كابتن مكرر\n`);
    } else {
      console.log('✅ لا توجد كباتن مكررة\n');
    }

    // 6. Remove duplicate Users (by user_name)
    console.log('👥 إزالة المستخدمين المكررين...');
    const users = await prisma.user.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const usersSeen = new Map();
    const usersToDelete = [];

    for (const user of users) {
      if (usersSeen.has(user.userName)) {
        usersToDelete.push(user.id);
      } else {
        usersSeen.set(user.userName, user.id);
      }
    }

    if (usersToDelete.length > 0) {
      await prisma.complain.deleteMany({
        where: {
          userId: { in: usersToDelete },
          tenantId: TENANT_ID
        }
      });

      await prisma.user.deleteMany({
        where: {
          id: { in: usersToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${usersToDelete.length} مستخدم مكرر\n`);
    } else {
      console.log('✅ لا يوجد مستخدمين مكررين\n');
    }

    // 7. Remove duplicate Menus (by vendor_id + photo - keep unique combinations)
    console.log('📋 إزالة قوائم الطعام المكررة...');
    const menus = await prisma.menu.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: { id: 'asc' }
    });

    const menusSeen = new Map();
    const menusToDelete = [];

    for (const menu of menus) {
      const key = `${menu.vendorId}_${menu.photo}`;
      if (menusSeen.has(key)) {
        menusToDelete.push(menu.id);
      } else {
        menusSeen.set(key, menu.id);
      }
    }

    if (menusToDelete.length > 0) {
      await prisma.menu.deleteMany({
        where: {
          id: { in: menusToDelete },
          tenantId: TENANT_ID
        }
      });
      console.log(`✅ تم حذف ${menusToDelete.length} قائمة طعام مكررة\n`);
    } else {
      console.log('✅ لا توجد قوائم طعام مكررة\n');
    }

    console.log('\n🎉 تم إزالة جميع التكرارات بنجاح!');
    
    // Show final counts
    const finalCounts = {
      items: await prisma.item.count({ where: { tenantId: TENANT_ID } }),
      categories: await prisma.category.count({ where: { tenantId: TENANT_ID } }),
      neighborhoods: await prisma.neighborhood.count({ where: { tenantId: TENANT_ID } }),
      vendors: await prisma.vendor.count({ where: { tenantId: TENANT_ID } }),
      captains: await prisma.captain.count({ where: { tenantId: TENANT_ID } }),
      users: await prisma.user.count({ where: { tenantId: TENANT_ID } }),
      menus: await prisma.menu.count({ where: { tenantId: TENANT_ID } }),
      orders: await prisma.order.count({ where: { tenantId: TENANT_ID } }),
      complains: await prisma.complain.count({ where: { tenantId: TENANT_ID } }),
      captainRequests: await prisma.captainRequest.count({ where: { tenantId: TENANT_ID } })
    };

    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   - ${finalCounts.items} صنف`);
    console.log(`   - ${finalCounts.categories} فئة`);
    console.log(`   - ${finalCounts.neighborhoods} حي`);
    console.log(`   - ${finalCounts.vendors} مطعم`);
    console.log(`   - ${finalCounts.captains} كابتن`);
    console.log(`   - ${finalCounts.users} مستخدم`);
    console.log(`   - ${finalCounts.menus} قائمة طعام`);
    console.log(`   - ${finalCounts.orders} طلب`);
    console.log(`   - ${finalCounts.complains} شكوى`);
    console.log(`   - ${finalCounts.captainRequests} طلب كابتن`);

  } catch (error) {
    console.error('❌ خطأ في إزالة التكرارات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });