const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');



class VendorPricingService {
  // Set or update vendor pricing for a neighborhood
  async setVendorNeighborhoodPrice(vendorId, pricingData, tenantId) {
    const { neighborhoodId, price } = pricingData;

    // Verify vendor exists within tenant
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: BigInt(vendorId),
        tenantId
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Verify neighborhood exists within tenant
    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        id: BigInt(neighborhoodId),
        tenantId
      }
    });

    if (!neighborhood) {
      throw new Error('Neighborhood not found');
    }

    // Check if pricing already exists for this vendor-neighborhood combination within tenant
    const existingPrice = await prisma.vendorNeighborhoodPrice.findFirst({
      where: {
        vendorId: BigInt(vendorId),
        neighborhoodId: BigInt(neighborhoodId),
        tenantId
      }
    });

    let vendorPrice;
    if (existingPrice) {
      // Update existing pricing
      vendorPrice = await prisma.vendorNeighborhoodPrice.update({
        where: {
          id_tenantId: {
            id: existingPrice.id,
            tenantId
          }
        },
        data: {
          price: parseFloat(price)
        },
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true
            }
          },
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } else {
      // Create new pricing
      vendorPrice = await prisma.vendorNeighborhoodPrice.create({
        data: {
          tenantId,
          vendorId: BigInt(vendorId),
          neighborhoodId: BigInt(neighborhoodId),
          price: parseFloat(price)
        },
        include: {
          vendor: {
            select: {
              id: true,
              vendorName: true
            }
          },
          neighborhood: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }

    return convertBigIntToString(vendorPrice);
  }

  // Get all pricing for a vendor
  async getVendorPricing(vendorId, tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get all neighborhoods with LEFT JOIN to vendor pricing
    const [allNeighborhoods, totalNeighborhoods] = await Promise.all([
      prisma.neighborhood.findMany({
        where: { tenantId },
        include: {
          vendorNeighborhoodPrices: {
            where: {
              vendorId: BigInt(vendorId),
              tenantId: tenantId
            },
            select: {
              neighborhoodId: true,
              price: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.neighborhood.count({ where: { tenantId } })
    ]);

    // Transform the data to include pricing with 0.0 for missing entries
    const pricing = allNeighborhoods.map(neighborhood => ({
      vendorId: vendorId,
      neighborhoodId: neighborhood.id,
      price: neighborhood.vendorNeighborhoodPrices.length > 0
        ? neighborhood.vendorNeighborhoodPrices[0].price
        : 0.0,
      neighborhood: {
        id: neighborhood.id,
        name: neighborhood.name
      }
    }));

    return {
      pricing: convertBigIntToString(pricing),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalNeighborhoods,
        pages: Math.ceil(totalNeighborhoods / limit)
      }
    };
  }

  // Get pricing for a specific vendor-neighborhood combination
  async getVendorNeighborhoodPrice(vendorId, neighborhoodId, tenantId) {
    const pricing = await prisma.vendorNeighborhoodPrice.findFirst({
      where: {
        vendorId: BigInt(vendorId),
        neighborhoodId: BigInt(neighborhoodId),
        tenantId
      },
      include: {
        vendor: {
          select: {
            id: true,
            vendorName: true
          }
        },
        neighborhood: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!pricing) {
      throw new Error('Pricing not found for this vendor-neighborhood combination');
    }

    return convertBigIntToString(pricing);
  }

  // Delete vendor pricing for a neighborhood
  async deleteVendorNeighborhoodPrice(vendorId, neighborhoodId, tenantId) {
    const pricing = await prisma.vendorNeighborhoodPrice.findUnique({
      where: {
        vendorId: BigInt(vendorId),
        neighborhoodId: BigInt(neighborhoodId),
        tenantId: tenantId
      }
    });

    if (!pricing) {
      throw new Error('Pricing not found for this vendor-neighborhood combination');
    }

    await prisma.vendorNeighborhoodPrice.delete({
      where: {
        id_tenantId: {
          id: pricing.id,
          tenantId
        }
      }
    });

    return { message: 'Vendor neighborhood pricing deleted successfully' };
  }

  // Get all neighborhoods with pricing for a vendor (useful for frontend)
  async getNeighborhoodsWithPricing(vendorId, tenantId) {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { tenantId },
      include: {
        vendorNeighborhoodPrices: {
          where: { vendorId: BigInt(vendorId), tenantId: tenantId },
          select: {
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to make it easier to use
    const neighborhoodsWithPricing = neighborhoods.map(neighborhood => ({
      id: neighborhood.id,
      name: neighborhood.name,
      price: neighborhood.vendorNeighborhoodPrices.length > 0
        ? neighborhood.vendorNeighborhoodPrices[0].price
        : null,
      hasPricing: neighborhood.vendorNeighborhoodPrices.length > 0
    }));

    return convertBigIntToString(neighborhoodsWithPricing);
  }
}

module.exports = new VendorPricingService(); 