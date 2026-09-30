const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class LookupController {
  // 1. Get All Lookup Options (Supports ?group=... or ?grouped=true)
  static async getAll(req, res, next) {
    try {
      const { group, grouped } = req.query;

      const where = group ? { group: { equals: group } } : {};

      const lookups = await prisma.lookupOption.findMany({
        where,
        orderBy: [{ group: 'asc' }, { value: 'asc' }]
      });

      if (grouped === 'true') {
        const groupedData = {};
        for (const item of lookups) {
          if (!groupedData[item.group]) {
            groupedData[item.group] = [];
          }
          groupedData[item.group].push(item);
        }
        return res.status(200).json(formatResponse(true, 'Grouped lookups fetched', groupedData));
      }

      return res.status(200).json(formatResponse(true, 'Lookups fetched successfully', lookups));
    } catch (error) {
      next(error);
    }
  }

  // 2. Create New Lookup Option
  static async create(req, res, next) {
    try {
      const { group, value } = req.body;

      if (!group || !value) {
        return res.status(400).json(formatResponse(false, 'Group aur Value dono required hain.'));
      }

      const trimmedGroup = group.trim();
      const trimmedValue = value.trim();

      const existing = await prisma.lookupOption.findUnique({
        where: {
          group_value: {
            group: trimmedGroup,
            value: trimmedValue
          }
        }
      });

      if (existing) {
        return res.status(400).json(formatResponse(false, 'This option already exists!'));
      }

      const created = await prisma.lookupOption.create({
        data: {
          group: trimmedGroup,
          value: trimmedValue
        }
      });

      return res.status(201).json(formatResponse(true, 'Lookup option added successfully! ✨', created));
    } catch (error) {
      next(error);
    }
  }

  // 3. Update Lookup Option
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const { group, value } = req.body;

      const lookup = await prisma.lookupOption.findUnique({ where: { id } });
      if (!lookup) {
        return res.status(404).json(formatResponse(false, 'Option not found!'));
      }

      const updated = await prisma.lookupOption.update({
        where: { id },
        data: {
          ...(group && { group: group.trim() }),
          ...(value && { value: value.trim() })
        }
      });

      return res.status(200).json(formatResponse(true, 'Option updated successfully!', updated));
    } catch (error) {
      next(error);
    }
  }

  // 4. Delete Lookup Option
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const lookup = await prisma.lookupOption.findUnique({ where: { id } });
      if (!lookup) {
        return res.status(404).json(formatResponse(false, 'Option not found!'));
      }

      await prisma.lookupOption.delete({ where: { id } });
      return res.status(200).json(formatResponse(true, 'Option deleted successfully!'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LookupController;
