const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (data && data.success && req.user) {
      try {
        await AuditLog.create({
          userId: req.user._id,
          userName: req.user.name,
          action,
          entity,
          entityId: req.params.id || (data.data && data.data._id) || null,
          newValue: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { auditLog };
