const { formatResponse } = require('../helpers/App.helper');

class AppController {
  static getStatus(req, res) {
    return res.status(200).json(
      formatResponse(true, 'Enterprise SaaS E-Commerce API is operational 🚀', {
        serverTime: new Date(),
        uptime: process.uptime()
      })
    );
  }
}

module.exports = AppController;
