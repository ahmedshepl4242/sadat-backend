const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');
const notificationService = require('./notificationService');



class ComplainService {
  // Create a new complain
  async createComplain(userId, complainData, tenantId) {
    const { description, type } = complainData;

    const complain = await prisma.complain.create({
      data: {
        tenantId,
        description,
        type,
        userId: BigInt(userId),
        submittedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Send notification to admin
    try {
      await notificationService.notifyAdminUserComplaint(complain.id, complain.user.userName, type, tenantId);
    } catch (error) {
      console.error('Failed to send complaint notification to admin:', error);
    }

    return convertBigIntToString(complain);
  }

  // Get user's complains
  async getUserComplains(userId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [complains, total] = await Promise.all([
      prisma.complain.findMany({
        where: {
          userId: BigInt(userId),
          tenantId
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
              phoneNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.complain.count({ where: { userId: BigInt(userId), tenantId } })
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
      prisma.complain.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
              phoneNumber: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.complain.count({ where: whereClause })
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
    const complain = await prisma.complain.findFirst({
      where: {
        id: BigInt(complainId),
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true
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
  async deleteComplain(complainId, userId, tenantId) {
    // Verify complain exists and belongs to user within tenant
    const complain = await prisma.complain.findFirst({
      where: {
        id: BigInt(complainId),
        userId: BigInt(userId),
        tenantId
      }
    });

    if (!complain) {
      throw new Error('Complain not found or access denied');
    }

    await prisma.complain.delete({
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
    const complain = await prisma.complain.findFirst({
      where: {
        id: BigInt(complainId),
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true
          }
        }
      }
    });

    if (!complain) {
      throw new Error('Complaint not found');
    }

    const updatedComplain = await prisma.complain.update({
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
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Send notification to user
    try {
      await notificationService.notifyUserComplaintReply(complain.userId, complainId, tenantId);
    } catch (error) {
      console.error('Failed to send complaint reply notification:', error);
    }

    return convertBigIntToString(updatedComplain);
  }
}

module.exports = new ComplainService(); 