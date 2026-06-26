const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');
const notificationService = require('./notificationService');



class VendorComplainService {
  // Create a new complain
  async createComplain(vendorId, complainData, tenantId) {
    const { description, type } = complainData;

    const complain = await prisma.vendorComplain.create({
      data: {
        tenantId,
        description,
        type,
        vendorId: BigInt(vendorId),
        submittedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            contactNumber: true
          }
        }
      }
    });

    // Send notification to admin
    try {
      await notificationService.notifyAdminVendorComplaint(complain.id, complain.vendor.vendorName, type, tenantId);
    } catch (error) {
      console.error('Failed to send complaint notification to admin:', error);
    }

    return convertBigIntToString(complain);
  }

  // Get vendor's complains
  async getVendorComplains(vendorId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [complains, total] = await Promise.all([
      prisma.vendorComplain.findMany({
        where: {
          vendorId: BigInt(vendorId),
          tenantId
        },
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendorComplain.count({ where: { vendorId: BigInt(vendorId), tenantId } })
    ]);

    return {
      complains: convertBigIntToString(complains),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all complains (admin endpoint)
  async getAllComplains(tenantId, page = 1, limit = 10, type = null) {
    const skip = (page - 1) * limit;

    const whereClause = { tenantId };
    if (type) {
      whereClause.type = type;
    }

    const [complains, total] = await Promise.all([
      prisma.vendorComplain.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true,
              contactNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.vendorComplain.count({ where: whereClause })
    ]);

    return {
      complains: convertBigIntToString(complains),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get complain by ID
  async getComplainById(complainId, tenantId) {
    const complain = await prisma.vendorComplain.findFirst({
      where: {
        id: BigInt(complainId),
        tenantId
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            contactNumber: true
          }
        }
      }
    });

    if (!complain) {
      throw new Error('Complain not found');
    }

    return convertBigIntToString(complain);
  }

  // Delete complain
  async deleteComplain(complainId, vendorId, tenantId) {
    // Verify complain exists and belongs to vendor within tenant
    const complain = await prisma.vendorComplain.findFirst({
      where: {
        id: BigInt(complainId),
        vendorId: BigInt(vendorId),
        tenantId
      }
    });

    if (!complain) {
      throw new Error('Complain not found or access denied');
    }

    await prisma.vendorComplain.delete({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      }
    });

    return { message: 'Complain deleted successfully' };
  }

  // Admin reply to complaint
  async replyToComplaint(complainId, reply, tenantId) {
    const complain = await prisma.vendorComplain.findFirst({
      where: {
        id: BigInt(complainId),
        tenantId
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true
          }
        }
      }
    });

    if (!complain) {
      throw new Error('Complaint not found');
    }

    const updatedComplain = await prisma.vendorComplain.update({
      where: {
        id_tenantId: {
          id: BigInt(complainId),
          tenantId
        }
      },
      data: {
        reply,
        repliedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true,
            contactNumber: true
          }
        }
      }
    });

    // Send notification to vendor
    try {
      await notificationService.notifyVendorComplaintReply(complain.vendorId, complainId, tenantId);
    } catch (error) {
      console.error('Failed to send complaint reply notification:', error);
    }

    return convertBigIntToString(updatedComplain);
  }
}

module.exports = new VendorComplainService();
