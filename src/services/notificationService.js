const { getMessaging } = require('../config/firebase');
const prisma = require('../utils/prisma');
const moment = require('moment-timezone');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');


function cairoMoment() {
  return moment().tz('Africa/Cairo');
}

// optional convenience: returns {hours, minutes, hhmm}
function getCairoTimeParts() {
  const m = cairoMoment();
  return { hours: m.hour(), minutes: m.minute(), hhmm: m.format('HH:mm') };
}




class NotificationService {
  constructor() {
    this.messaging = getMessaging();
  }

  // Send notification to a single token
  async sendNotification(token, title, body, data = {}) {
    if (!this.messaging || !token) {
      console.log('FCM not initialized or token not provided');
      return false;
    }

    try {
      const message = {
        notification: {
          "title": title,
          "body": body,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        token,
        android: {
          notification: {
            channelId: 'orders_channel', // must match what you created in Flutter
            sound: 'order_ping',         // your custom raw resource sound
            priority: 'high',
          },
        },
      };

      const response = await this.messaging.send(message);
      console.log('Successfully sent message:', response);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Send notification to multiple tokens
  async sendMulticastNotification(tokens, title, body, data = {}) {
    if (!this.messaging || !tokens || tokens.length === 0) {
      console.log('FCM not initialized or no tokens provided');
      return false;
    }

    try {
      const imageUrl = data.imageUrl || null;
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl ? { imageUrl } : {}),
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            imageUrl: imageUrl || undefined,
          },
        },
        apns: imageUrl ? {
          payload: { aps: { 'mutable-content': 1 } },
          fcmOptions: { imageUrl },
        } : undefined,
        tokens: tokens.filter(token => token), // Filter out null/undefined tokens
      };

      if (message.tokens.length === 0) {
        console.log('No valid tokens to send notifications to');
        return false;
      }

      const response = await this.messaging.sendEachForMulticast(message);
      console.log('Successfully sent multicast message:', response);

      // Handle partial failures
      if (response.failureCount > 0) {
        console.warn(`${response.failureCount} messages failed to send out of ${response.responses.length}`);
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${idx}:`, resp.error);
          }
        });
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('Error sending multicast message:', error);

      // More specific error handling
      if (error.code === 'messaging/invalid-argument') {
        console.error('Invalid FCM tokens provided');
      } else if (error.code === 'messaging/authentication-error') {
        console.error('Firebase authentication failed - check service account key');
      } else if (error.code === 'messaging/unknown-error') {
        console.error('Firebase server error - this might be a temporary issue');
      }

      return false;
    }
  }

  // Send notification to user
  async sendToUser(userId, title, body, tenantId, data = {}) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id_tenantId: {
            id: BigInt(userId),
            tenantId
          }
        },
        select: { fcmToken: true, userName: true },
      });

      if (!user || !user.fcmToken) {
        console.log(`User ${userId} not found or no FCM token`);
        return false;
      }

      return await this.sendNotification(user.fcmToken, title, body, {
        ...data,
        userType: 'USER',
        userId: userId.toString(),
      });
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  // Send notification to vendor
  async sendToVendor(vendorId, title, body, tenantId, data = {}) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: {
          id_tenantId: {
            id: BigInt(vendorId),
            tenantId
          }
        },
        select: { fcmToken: true, vendorName: true, isLocked: true },
      });

      if (!vendor || !vendor.fcmToken || vendor.isLocked) {
        console.log(`Vendor ${vendorId} not found, locked, or no FCM token`);
        return false;
      }

      return await this.sendNotification(vendor.fcmToken, title, body, {
        ...data,
        userType: 'VENDOR',
        vendorId: vendorId.toString(),
      });
    } catch (error) {
      console.error('Error sending notification to vendor:', error);
      return false;
    }
  }

  // Send notification to captain
  async sendToCaptain(captainId, title, body, tenantId, data = {}) {
    try {
      const captain = await prisma.captain.findUnique({
        where: {
          id_tenantId: {
            id: BigInt(captainId),
            tenantId
          }
        },
        select: { fcmToken: true, userName: true },
      });

      if (!captain || !captain.fcmToken) {
        console.log(`Captain ${captainId} not found or no FCM token`);
        return false;
      }

      return await this.sendNotification(captain.fcmToken, title, body, {
        ...data,
        userType: 'CAPTAIN',
        captainId: captainId.toString(),
      });
    } catch (error) {
      console.error('Error sending notification to captain:', error);
      return false;
    }
  }

  // Send notification to admin
  async sendToAdmin(title, body, data = {}, tenantId) {
    try {
      const admin = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { fcmToken: true, tenantName: true },
      });

      if (!admin || !admin.fcmToken) {
        console.log('Admin not found or no FCM token');
        return false;
      }

      return await this.sendNotification(admin.fcmToken, title, body, {
        ...data,
        userType: 'ADMIN',
      });
    } catch (error) {
      console.error('Error sending notification to admin:', error);
      return false;
    }
  }

  // Send notification to all available captains
  async sendToAllAvailableCaptains(title, body, data = {}, tenantId) {
    try {

      // Use Cairo time (Moment object) and read hour/minute via .hour() .minute()
      const now = moment().tz('Africa/Cairo');
      const currentHours = now.hour();
      const currentMinutes = now.minute();

      const captains = await prisma.captain.findMany({
        where: {
          tenantId,
          isAvailable: true,
          isLocked: false,
          fcmToken: { not: null },
        },
        select: {
          fcmToken: true,
          id: true,
          workingHoursStart: true,
          workingHoursEnd: true
        },
      });

      if (captains.length === 0) {
        console.log('No available captains with FCM tokens found');
        return false;
      }
      // Filter captains whose working hours include current time
      const availableCaptains = captains.filter(captain => {
        if (!captain.workingHoursStart || !captain.workingHoursEnd) {
          return true; // Skip if no working hours defined
        }

        // Parse working hours (format: "HH:MM")
        const [startHour, startMinute] = captain.workingHoursStart.split(':').map(Number);
        const [endHour, endMinute] = captain.workingHoursEnd.split(':').map(Number);

        // Convert to minutes since midnight for easier comparison
        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        // Handle overnight shifts (e.g., 22:00-06:00)
        if (startTotalMinutes > endTotalMinutes) {
          return currentTotalMinutes >= startTotalMinutes ||
            currentTotalMinutes <= endTotalMinutes;
        } else {
          return currentTotalMinutes >= startTotalMinutes &&
            currentTotalMinutes <= endTotalMinutes;
        }
      });
      const tokens = availableCaptains.map(captain => captain.fcmToken).filter(token => token);
      // just log if failed to send to some captains
      // for(let token of tokens){
      //   const success = await this.sendNotification(token, title, body, {
      //     ...data,
      //     userType: 'CAPTAIN'
      //   });
      //   if (!success) {
      //     console.log(`Failed to send notification to captain with token: ${token}`);
      //   }
      // }
      const success = await this.sendMulticastNotification(tokens, title, body, {
        ...data,
        userType: 'CAPTAIN'
      });
      return success;
    } catch (error) {
      console.error('Error sending notification to all captains:', error);
      return false;
    }
  }

  // Order-specific notification methods
  async notifyNewOrder(vendorId, orderId, tenantId) {
    return await this.sendToVendor(
      vendorId,
      'طلب جديد',
      'لقد استلمت طلباً جديداً. تحقق من التطبيق لمزيد من التفاصيل.',
      tenantId,
      { orderId: orderId.toString(), type: 'NEW_ORDER' }
    );
  }

  async notifyCounterOffer(userId, orderId, price, deliveryPrice, tenantId) {
    return await this.sendToUser(
      userId,
      'عرض مقابل',
      `أرسل البائع عرضاً مقابلاً بسعر ${price} جنيه، سعر التوصيل ${deliveryPrice} جنيه. تحقق من التطبيق للقبول أو الرفض.`,
      tenantId,
      { orderId: orderId.toString(), type: 'COUNTER_OFFER', price: price.toString() }
    );
  }

  async notifyOrderApproved(vendorId, orderId, tenantId) {
    const results = await Promise.all([
      this.sendToVendor(
        vendorId,
        'تمت الموافقة على الطلب',
        'تمت الموافقة على طلبك من قبل العميل.',
        tenantId,
        { orderId: orderId.toString(), type: 'ORDER_APPROVED' }
      ),
      this.sendToAllAvailableCaptains(
        'طلب توصيل جديد',
        'يوجد طلب توصيل جديد متاح. تحقق من التطبيق للقبول.',
        { orderId: orderId.toString(), type: 'DELIVERY_AVAILABLE' },
        tenantId
      ),
    ]);

    return results.every(result => result);
  }

  async notifyCaptainAccepted(vendorId, userId, orderId, captainId, tenantId) {
    const results = await Promise.all([
      this.sendToVendor(
        vendorId,
        'تم تعيين كابتن',
        'تم تعيين كابتن لطلبك.',
        tenantId,
        { orderId: orderId.toString(), type: 'CAPTAIN_ASSIGNED', captainId: captainId.toString() }
      ),
      userId ? this.sendToUser(
        userId,
        'تم تعيين كابتن',
        'تم تعيين كابتن لطلبك وهو في الطريق إليك.',
        tenantId,
        { orderId: orderId.toString(), type: 'CAPTAIN_ASSIGNED', captainId: captainId.toString() }
      ) : Promise.resolve(true),
    ]);

    return results.every(result => result);
  }

  async notifyOrderCancelled(vendorId, orderId, tenantId) {
    return await this.sendToVendor(
      vendorId,
      'تم إلغاء الطلب',
      'تم إلغاء أحد الطلبات.',
      tenantId,
      { orderId: orderId.toString(), type: 'ORDER_CANCELLED' }
    );
  }

  async notifyOrderDelivered(userId, orderId, tenantId) {
    if (!userId) return true; // No user to notify for vendor-created orders

    return await this.sendToUser(
      userId,
      'تم توصيل الطلب',
      'تم توصيل طلبك بنجاح. يرجى تقييم تجربتك.',
      tenantId,
      { orderId: orderId.toString(), type: 'ORDER_DELIVERED' }
    );
  }

  async notifyCaptainArrived(userId, orderId, tenantId) {
    if (!userId) return true; // No user to notify for vendor-created orders

    return await this.sendToUser(
      userId,
      'وصل الكابتن',
      'وصل كابتن التوصيل إلى موقعك.',
      tenantId,
      { orderId: orderId.toString(), type: 'CAPTAIN_ARRIVED' }
    );
  }

  // Notify admin about special orders
  async notifyAdminSpecialOrder(orderId, tenantId) {
    return await this.sendToAdmin(
      'طلب خاص',
      'تم استلام طلب خاص ويحتاج إلى اهتمام المدير. تحقق من لوحة التحكم للتفاصيل.',
      { orderId: orderId.toString(), type: 'SPECIAL_ORDER' },
      tenantId
    );
  }

  // Notify admin when captain makes a request
  async notifyAdminCaptainRequest(requestId, captainName, tenantId) {
    return await this.sendToAdmin(
      'طلب جديد من كابتن ',
      `الكابتن ${captainName} قدم طلباً جديداً يتطلب مراجعتك.`,
      { requestId: requestId.toString(), type: 'CAPTAIN_REQUEST' },
      tenantId
    );
  }

  // Notify admin when user submits a complaint
  async notifyAdminUserComplaint(complainId, userName, type, tenantId) {
    return await this.sendToAdmin(
      'شكوى عميل جديدة',
      `العميل ${userName} قدم شكوى تتطلب اهتمامك.`,
      { complainId: complainId.toString(), type: 'USER_COMPLAINT', complainType: type },
      tenantId
    );
  }

  // Notify user when admin replies to their complaint
  async notifyUserComplaintReply(userId, complainId, tenantId) {
    return await this.sendToUser(
      userId,
      'رد المدير على شكواك',
      'رد المدير على شكواك. تحقق من التطبيق للاطلاع على الرد.',
      tenantId,
      { complainId: complainId.toString(), type: 'COMPLAINT_REPLY' }
    );
  }

  // Notify admin when vendor submits a complaint
  async notifyAdminVendorComplaint(complainId, vendorName, type, tenantId) {
    return await this.sendToAdmin(
      'شكوى تاجر جديدة',
      `التاجر ${vendorName} قدم شكوى تتطلب اهتمامك.`,
      { complainId: complainId.toString(), type: 'VENDOR_COMPLAINT', complainType: type },
      tenantId
    );
  }

  // Notify vendor when admin replies to their complaint
  async notifyVendorComplaintReply(vendorId, complainId, tenantId) {
    return await this.sendToVendor(
      vendorId,
      'رد المدير على شكواك',
      'رد المدير على شكواك. تحقق من التطبيق للاطلاع على الرد.',
      tenantId,
      { complainId: complainId.toString(), type: 'COMPLAINT_REPLY' }
    );
  }

  // Notify captain when admin replies to their request
  async notifyCaptainRequestReply(captainId, requestId, status, tenantId) {
    const title = status === 'APPROVED' ? 'تمت الموافقة على الطلب' : 'تحديث الطلب';
    const body = status === 'APPROVED'
      ? 'تمت الموافقة على طلبك من قبل المدير. تحقق من التطبيق للتفاصيل.'
      : 'رد المدير على طلبك. تحقق من التطبيق للاطلاع على الرد.';

    return await this.sendToCaptain(
      captainId,
      title,
      body,
      tenantId,
      { requestId: requestId.toString(), type: 'REQUEST_REPLY', status }
    );
  }

  // Notify when captain exceeds max earnings
  async notifyMaxEarningsExceeded(captainId, captainName, tenantId) {
    const results = await Promise.all([
      // Notify admin
      this.sendToAdmin(
        'تجاوز الكابتن الحد الأقصى من الأرباح',
        `لقد جاوز الكابتن ${captainName} الحد الاقصى من الارباح. سيتم اغلاق حساب الكابتن بشكل تلقائي بعد توصيل ما معه من الاوردرات`,
        { captainId: captainId.toString(), type: 'MAX_EARNINGS_EXCEEDED' },
        tenantId
      ),
      // Notify captain
      this.sendToCaptain(
        captainId,
        'الحد الأقصى من الأوردرات',
        'لقد وصلت الى الحد الاقصي من الاوردرات. برجاء انهاء ما معك من الاوردرات والذهاب لتقفيل حسابك مع المدير',
        tenantId,
        { type: 'MAX_EARNINGS_EXCEEDED' }
      )
    ]);

    return results.every(r => r === true);
  }

  // Notify admin when new vendor signs up
  async notifyAdminNewVendorSignup(vendorId, vendorName, tenantId) {
    return await this.sendToAdmin(
      'بائع جديد',
      `بائع جديد ${vendorName} قام بالتسجيل وينتظر تفعيل الحساب.`,
      { vendorId: vendorId.toString(), type: 'NEW_VENDOR_SIGNUP' },
      tenantId
    );
  }

  // Notify admin when new captain signs up
  async notifyAdminNewCaptainSignup(captainId, captainName, tenantId) {
    return await this.sendToAdmin(
      'كابتن جديد',
      `كابتن جديد ${captainName} قام بالتسجيل وينتظر تفعيل الحساب.`,
      { captainId: captainId.toString(), type: 'NEW_CAPTAIN_SIGNUP' },
      tenantId
    );
  }

  // Broadcast announcement to ALL users of a tenant
  async sendToAllUsers(title, body, data = {}, tenantId) {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = users.map(u => u.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending announcement to ${tokens.length} users (tenant: ${tenantId})`);
      if (tokens.length === 0) {
        console.log('[FCM] No user tokens found, skipping.');
        return false;
      }
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        console.log(`[FCM] Sending user batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tokens`);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'USER' });
        console.log(`[FCM] User batch result: ${result ? 'success' : 'failed'}`);
        if (result) success = true;
      }
      console.log(`[FCM] sendToAllUsers done. Overall success: ${success}`);
      return success;
    } catch (error) {
      console.error('[FCM] Error sending notification to all users:', error);
      return false;
    }
  }

  // Send announcement to SPECIFIC users by id
  async sendToSpecificUsers(title, body, data = {}, tenantId, userIds) {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId, id: { in: userIds.map(BigInt) }, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = users.map(u => u.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending to ${tokens.length} specific users`);
      if (tokens.length === 0) return false;
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'USER' });
        if (result) success = true;
      }
      return success;
    } catch (error) {
      console.error('[FCM] Error sending to specific users:', error);
      return false;
    }
  }

  // Send announcement to SPECIFIC captains by id
  async sendToSpecificCaptains(title, body, data = {}, tenantId, captainIds) {
    try {
      const captains = await prisma.captain.findMany({
        where: { tenantId, id: { in: captainIds.map(BigInt) }, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = captains.map(c => c.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending to ${tokens.length} specific captains`);
      if (tokens.length === 0) return false;
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'CAPTAIN' });
        if (result) success = true;
      }
      return success;
    } catch (error) {
      console.error('[FCM] Error sending to specific captains:', error);
      return false;
    }
  }

  // Broadcast announcement to ALL captains of a tenant
  async sendToAllCaptains(title, body, data = {}, tenantId) {
    try {
      const captains = await prisma.captain.findMany({
        where: { tenantId, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = captains.map(c => c.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending announcement to ${tokens.length} captains (tenant: ${tenantId})`);
      if (tokens.length === 0) {
        console.log('[FCM] No captain tokens found, skipping.');
        return false;
      }
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        console.log(`[FCM] Sending captain batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tokens`);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'CAPTAIN' });
        console.log(`[FCM] Captain batch result: ${result ? 'success' : 'failed'}`);
        if (result) success = true;
      }
      console.log(`[FCM] sendToAllCaptains done. Overall success: ${success}`);
      return success;
    } catch (error) {
      console.error('[FCM] Error sending notification to all captains:', error);
      return false;
    }
  }

  // Broadcast announcement to ALL vendors of a tenant
  async sendToAllVendors(title, body, data = {}, tenantId) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: { tenantId, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = vendors.map(v => v.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending announcement to ${tokens.length} vendors (tenant: ${tenantId})`);
      if (tokens.length === 0) {
        console.log('[FCM] No vendor tokens found, skipping.');
        return false;
      }
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        console.log(`[FCM] Sending vendor batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tokens`);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'VENDOR' });
        console.log(`[FCM] Vendor batch result: ${result ? 'success' : 'failed'}`);
        if (result) success = true;
      }
      console.log(`[FCM] sendToAllVendors done. Overall success: ${success}`);
      return success;
    } catch (error) {
      console.error('[FCM] Error sending notification to all vendors:', error);
      return false;
    }
  }

  // Send announcement to SPECIFIC vendors by id
  async sendToSpecificVendors(title, body, data = {}, tenantId, vendorIds) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: { tenantId, id: { in: vendorIds.map(BigInt) }, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = vendors.map(v => v.fcmToken).filter(Boolean);
      console.log(`[FCM] Sending to ${tokens.length} specific vendors`);
      if (tokens.length === 0) return false;
      const BATCH_SIZE = 500;
      let success = false;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const result = await this.sendMulticastNotification(batch, title, body, { ...data, userType: 'VENDOR' });
        if (result) success = true;
      }
      return success;
    } catch (error) {
      console.error('[FCM] Error sending to specific vendors:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();