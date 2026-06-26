const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');
const notificationService = require('./notificationService');



class CaptainRequestService {
  // Submit a new request by captain
  async submitRequest(captainId, description, tenantId) {
    const request = await prisma.captainRequest.create({
      data: {
        tenantId,
        captainId: BigInt(captainId),
        description,
        status: 'PENDING'
      },
      include: {
        captain: {
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
      await notificationService.notifyAdminCaptainRequest(request.id, request.captain.userName, tenantId);
    } catch (error) {
      console.error('Failed to send captain request notification to admin:', error);
    }

    return convertBigIntToString(request);
  }

  // Get requests by captain
  async getRequestsByCaptain(captainId, tenantId, page = 1, limit = 10, status = null) {
    const skip = (page - 1) * limit;

    const whereClause = { captainId: BigInt(captainId), tenantId };
    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.captainRequest.findMany({
        where: whereClause,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.captainRequest.count({ where: whereClause })
    ]);

    return {
      requests: convertBigIntToString(requests),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all requests (for admin purposes)
  async getAllRequests(page = 1, limit = 10, status = null, tenantId) {
    const skip = (page - 1) * limit;

    const whereClause = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.captainRequest.findMany({
        where: whereClause,
        include: {
          captain: {
            select: {
              id: true,
              userName: true,
              email: true,
              phoneNumber: true,
              isLocked: true,
              isAvailable: true,
              ratingCount: true,
              ratingSum: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.captainRequest.count({ where: whereClause })
    ]);

    return {
      requests: convertBigIntToString(requests),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get request by ID
  async getRequestById(requestId, tenantId) {
    const request = await prisma.captainRequest.findFirst({
      where: {
        id: BigInt(requestId),
        tenantId
      },
      include: {
        captain: {
          select: {
            id: true,
            userName: true,
            email: true,
            phoneNumber: true,
            isLocked: true,
            isAvailable: true,
            ratingCount: true,
            ratingSum: true
          }
        }
      }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    return convertBigIntToString(request);
  }



  // Delete request (captain can delete their own pending requests)
  async deleteRequest(requestId, captainId, tenantId) {
    const request = await prisma.captainRequest.findFirst({
      where: {
        id: BigInt(requestId),
        captainId: BigInt(captainId),
        tenantId,
        status: 'PENDING'
      }
    });

    if (!request) {
      throw new Error('Request not found or cannot be deleted');
    }

    await prisma.captainRequest.delete({
      where: {
        id_tenantId: {
          id: BigInt(requestId),
          tenantId
        }
      }
    });

    return { message: 'Request deleted successfully' };
  }
}

module.exports = new CaptainRequestService(); 