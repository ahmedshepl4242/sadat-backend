const prisma = require('../utils/prisma');
const { convertBigIntToString } = require('../utils/helpers');



class CategoryService {
  // Create category (admin endpoint)
  async createCategory(categoryData, tenantId) {
    const { name } = categoryData;

    // Check if category already exists within tenant
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        tenantId
      }
    });

    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }

    const maxOrder = await prisma.category.aggregate({
      where: { tenantId },
      _max: { sortOrder: true }
    });

    const category = await prisma.category.create({
      data: {
        name,
        tenantId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1
      }
    });

    return convertBigIntToString(category);
  }

  // Get all categories
  async getAllCategories(tenantId) {
    const categories = await prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      categories: convertBigIntToString(categories)
    };
  }

  // Reorder categories
  async reorderCategories(orderedIds, tenantId) {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id_tenantId: { id: BigInt(id), tenantId } },
          data: { sortOrder: index }
        })
      )
    );

    return this.getAllCategories(tenantId);
  }

  // Get category by ID
  async getCategoryById(categoryId, tenantId) {
    const category = await prisma.category.findFirst({
      where: {
        id: BigInt(categoryId),
        tenantId
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return convertBigIntToString(category);
  }

  // Update category
  async updateCategory(categoryId, categoryData, tenantId) {
    const { name } = categoryData;

    // Check if name is being changed and if it already exists
    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          tenantId,
          NOT: { id: BigInt(categoryId) }
        }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    const category = await prisma.category.update({
      where: {
        id_tenantId: {
          id: BigInt(categoryId),
          tenantId
        }
      },
      data: { name }
    });

    return convertBigIntToString(category);
  }

  // Delete category
  async deleteCategory(categoryId, tenantId) {
    await prisma.category.delete({
      where: {
        id_tenantId: {
          id: BigInt(categoryId),
          tenantId
        }
      }
    });

    return { message: 'Category deleted successfully' };
  }
}

module.exports = new CategoryService();
