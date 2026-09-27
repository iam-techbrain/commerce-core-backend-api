const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class AttributeController {
  // 1. Get All Attributes with their values
  static async getAll(req, res, next) {
    try {
      const attributes = await prisma.attribute.findMany({
        include: {
          values: {
            orderBy: { id: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      return res.status(200).json(
        formatResponse(true, 'Master attributes fetched successfully', attributes)
      );
    } catch (error) {
      next(error);
    }
  }

  // 2. Create New Master Attribute (e.g. "Color", "Size", "Weight", "Height")
  static async createAttribute(req, res, next) {
    try {
      const { name, values } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json(formatResponse(false, 'Attribute name required hai (jaise: Color, Size, Weight).'));
      }

      const trimmedName = name.trim();
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const existing = await prisma.attribute.findFirst({
        where: {
          OR: [{ name: trimmedName }, { slug }]
        }
      });

      if (existing) {
        return res.status(400).json(formatResponse(false, `Attribute "${trimmedName}" pehle se exist karta hai!`));
      }

      const attribute = await prisma.attribute.create({
        data: {
          name: trimmedName,
          slug
        }
      });

      // If initial values were passed (array of strings or { value, colorCode })
      if (values && Array.isArray(values) && values.length > 0) {
        for (const item of values) {
          const valStr = typeof item === 'string' ? item.trim() : (item.value ? item.value.trim() : null);
          const colorCode = typeof item === 'object' && item.colorCode ? item.colorCode.trim() : null;

          if (valStr) {
            await prisma.attributeValue.create({
              data: {
                attributeId: attribute.id,
                value: valStr,
                colorCode
              }
            }).catch(() => {}); // Ignore duplicate
          }
        }
      }

      const fullAttribute = await prisma.attribute.findUnique({
        where: { id: attribute.id },
        include: { values: true }
      });

      return res.status(201).json(
        formatResponse(true, `Master Attribute "${trimmedName}" successfully create ho gaya! 🎉`, fullAttribute)
      );
    } catch (error) {
      next(error);
    }
  }

  // 3. Add Value to an Attribute (e.g. Add "Red" to "Color")
  static async addValue(req, res, next) {
    try {
      const attributeId = parseInt(req.params.id);
      const { value, colorCode } = req.body;

      if (!value || !value.trim()) {
        return res.status(400).json(formatResponse(false, 'Value required hai (jaise: Red, UK 8, 10kg).'));
      }

      const trimmedValue = value.trim();

      const attribute = await prisma.attribute.findUnique({
        where: { id: attributeId }
      });

      if (!attribute) {
        return res.status(404).json(formatResponse(false, 'Attribute nahi mila!'));
      }

      const existingVal = await prisma.attributeValue.findUnique({
        where: {
          attributeId_value: {
            attributeId,
            value: trimmedValue
          }
        }
      });

      if (existingVal) {
        return res.status(400).json(formatResponse(false, `Value "${trimmedValue}" is attribute me pehle se exist karti hai!`));
      }

      const createdValue = await prisma.attributeValue.create({
        data: {
          attributeId,
          value: trimmedValue,
          colorCode: colorCode ? colorCode.trim() : null
        }
      });

      return res.status(201).json(
        formatResponse(true, `Value "${trimmedValue}" successfully add ho gayi!`, createdValue)
      );
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete an Attribute Value
  static async deleteValue(req, res, next) {
    try {
      const valueId = parseInt(req.params.valueId);

      const val = await prisma.attributeValue.findUnique({
        where: { id: valueId }
      });

      if (!val) {
        return res.status(404).json(formatResponse(false, 'Attribute value nahi mili!'));
      }

      await prisma.attributeValue.delete({
        where: { id: valueId }
      });

      return res.status(200).json(formatResponse(true, 'Attribute value successfully delete ho gayi!'));
    } catch (error) {
      next(error);
    }
  }

  // 5. Delete Entire Attribute (Cascades values)
  static async deleteAttribute(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const attr = await prisma.attribute.findUnique({
        where: { id }
      });

      if (!attr) {
        return res.status(404).json(formatResponse(false, 'Attribute nahi mila!'));
      }

      await prisma.attribute.delete({
        where: { id }
      });

      return res.status(200).json(formatResponse(true, `Attribute "${attr.name}" successfully delete ho gaya!`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttributeController;
