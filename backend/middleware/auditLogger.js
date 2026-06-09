const { AuditLog } = require("../models/models");

/**
 * Middleware that logs actions to the audit_logs table.
 * Usage: auditLogger("CREATE", "case")
 */
const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Log after response is determined
      const userId = req.user ? req.user.user_id : null;
      const resourceId = req.params.id || req.params.caseId || req.params.conversationId || null;

      AuditLog.create({
        user_id: userId,
        action,
        resource,
        resource_id: resourceId,
        details: JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
      }).catch((err) => console.error("Audit log error:", err));

      return originalJson(body);
    };

    next();
  };
};

module.exports = { auditLogger };
