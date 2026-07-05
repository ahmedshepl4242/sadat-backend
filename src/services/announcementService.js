const prisma = require('../utils/prisma');
const notificationService = require('./notificationService');

class AnnouncementService {
  _serialize(a) {
    return {
      id: a.id.toString(),
      tenant_id: a.tenantId,
      title: a.title,
      body: a.body,
      image_url: a.imageUrl ?? null,
      is_published: a.isPublished,
      published_at: a.publishedAt ? a.publishedAt.toISOString() : null,
      created_at: a.createdAt.toISOString(),
    };
  }

  async getAll(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where: { tenantId } }),
    ]);
    return {
      announcements: announcements.map(a => this._serialize(a)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPublished(tenantId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: { tenantId, isPublished: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where: { tenantId, isPublished: true } }),
    ]);
    return {
      announcements: announcements.map(a => this._serialize(a)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async create(tenantId, { title, body, imageUrl }) {
    const announcement = await prisma.announcement.create({
      data: { tenantId, title, body, imageUrl: imageUrl || null },
    });
    return this._serialize(announcement);
  }

  async update(id, tenantId, { title, body, imageUrl }) {
    const existing = await prisma.announcement.findFirst({
      where: { id: BigInt(id), tenantId },
    });
    if (!existing) throw new Error('Announcement not found');
    if (existing.isPublished) throw new Error('Cannot edit a published announcement');

    const updated = await prisma.announcement.update({
      where: { id_tenantId: { id: BigInt(id), tenantId } },
      data: {
        title,
        body,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      },
    });
    return this._serialize(updated);
  }

  async delete(id, tenantId) {
    const existing = await prisma.announcement.findFirst({
      where: { id: BigInt(id), tenantId },
    });
    if (!existing) throw new Error('Announcement not found');
    await prisma.announcement.delete({
      where: { id_tenantId: { id: BigInt(id), tenantId } },
    });
  }

  async publish(id, tenantId, { userIds, captainIds, vendorIds } = {}) {
    const existing = await prisma.announcement.findFirst({
      where: { id: BigInt(id), tenantId },
    });
    if (!existing) throw new Error('Announcement not found');
    if (existing.isPublished) throw new Error('Already published');

    const updated = await prisma.announcement.update({
      where: { id_tenantId: { id: BigInt(id), tenantId } },
      data: { isPublished: true, publishedAt: new Date() },
    });

    const serialized = this._serialize(updated);
    const notifData = {
      type: 'ANNOUNCEMENT',
      announcementId: serialized.id,
      ...(existing.imageUrl ? { imageUrl: existing.imageUrl } : {}),
    };
    // userIds/captainIds/vendorIds: null = all, [] = skip, [ids] = specific
    const skipUsers = Array.isArray(userIds) && userIds.length === 0;
    const skipCaptains = Array.isArray(captainIds) && captainIds.length === 0;
    const skipVendors = Array.isArray(vendorIds) && vendorIds.length === 0;

    if (!skipUsers) {
      const send = Array.isArray(userIds) && userIds.length > 0
        ? notificationService.sendToSpecificUsers(existing.title, existing.body, notifData, tenantId, userIds)
        : notificationService.sendToAllUsers(existing.title, existing.body, notifData, tenantId);
      send.catch(console.error);
    }

    if (!skipCaptains) {
      const send = Array.isArray(captainIds) && captainIds.length > 0
        ? notificationService.sendToSpecificCaptains(existing.title, existing.body, notifData, tenantId, captainIds)
        : notificationService.sendToAllCaptains(existing.title, existing.body, notifData, tenantId);
      send.catch(console.error);
    }

    if (!skipVendors) {
      const send = Array.isArray(vendorIds) && vendorIds.length > 0
        ? notificationService.sendToSpecificVendors(existing.title, existing.body, notifData, tenantId, vendorIds)
        : notificationService.sendToAllVendors(existing.title, existing.body, notifData, tenantId);
      send.catch(console.error);
    }

    return serialized;
  }
}

module.exports = new AnnouncementService();
