const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');



class NeighborhoodService {
  // Create a new neighborhood
  async createNeighborhood(neighborhoodData, tenantId) {
    const { name } = neighborhoodData;

    // Check if neighborhood already exists within tenant
    const existingNeighborhood = await prisma.neighborhood.findFirst({
      where: {
        name,
        tenantId
      }
    });

    if (existingNeighborhood) {
      throw new Error('Neighborhood with this name already exists');
    }

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name,
        tenantId
      }
    });

    return convertBigIntToString(neighborhood);
  }

  // Get all neighborhoods
  async getAllNeighborhoods(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [neighborhoods, total] = await Promise.all([
      prisma.neighborhood.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.neighborhood.count({ where: { tenantId } })
    ]);

    return {
      neighborhoods: convertBigIntToString(neighborhoods),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get neighborhood by ID
  async getNeighborhoodById(neighborhoodId, tenantId) {
    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        id: BigInt(neighborhoodId),
        tenantId
      }
    });

    if (!neighborhood) {
      throw new Error('Neighborhood not found');
    }

    return convertBigIntToString(neighborhood);
  }

  // Update neighborhood
  async updateNeighborhood(neighborhoodId, updateData, tenantId) {
    const { name } = updateData;

    // Check if neighborhood exists within tenant
    const existingNeighborhood = await prisma.neighborhood.findFirst({
      where: {
        id: BigInt(neighborhoodId),
        tenantId
      }
    });

    if (!existingNeighborhood) {
      throw new Error('Neighborhood not found');
    }

    // Check if name is being changed and if it already exists within tenant
    if (name && name !== existingNeighborhood.name) {
      const duplicateNeighborhood = await prisma.neighborhood.findFirst({
        where: {
          name,
          tenantId
        }
      });

      if (duplicateNeighborhood) {
        throw new Error('Neighborhood with this name already exists');
      }
    }

    const updatedNeighborhood = await prisma.neighborhood.update({
      where: {
        id_tenantId: {
          id: BigInt(neighborhoodId),
          tenantId
        }
      },
      data: { name }
    });

    return convertBigIntToString(updatedNeighborhood);
  }

  // Delete neighborhood
  async deleteNeighborhood(neighborhoodId, tenantId) {
    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        id: BigInt(neighborhoodId),
        tenantId
      }
    });

    if (!neighborhood) {
      throw new Error('Neighborhood not found');
    }

    await prisma.neighborhood.delete({
      where: {
        id_tenantId: {
          id: BigInt(neighborhoodId),
          tenantId
        }
      }
    });

    return { message: 'Neighborhood deleted successfully' };
  }
}

module.exports = new NeighborhoodService(); 