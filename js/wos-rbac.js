/**
 * Warehouse Operating System (WOS)
 * Zero-Trust Role-Based Access Control (RBAC) & Separation of Duties (SoD) Engine
 */

const WOS_RBAC = (function () {

    function getActiveUser() {
        const state = WOS_Data.getState();
        return state.activeUser || state.users[0];
    }

    function getActiveRole() {
        const user = getActiveUser();
        const state = WOS_Data.getState();
        return state.roles.find(r => r.id === user.roleId) || state.roles[0];
    }

    function hasPermission(permKey) {
        const role = getActiveRole();
        if (!role || !role.permissions) return false;
        return role.permissions.includes(permKey);
    }

    /**
     * Strict Separation of Duties (SoD) Verification for Stock Adjustments
     * - Requires 'inventory.adjust_approve' permission
     * - Requester CANNOT be the approver (Prevents self-approval collusion)
     * - Variance value cannot exceed the user's delegated approvalLimit
     */
    function checkAdjustmentApprovalPolicy(adjustment) {
        const user = getActiveUser();
        
        if (!hasPermission('inventory.adjust_approve')) {
            return {
                allowed: false,
                code: 'PERMISSION_DENIED',
                reason: `Role '${getActiveRole().name}' is not authorized to approve inventory write-offs.`
            };
        }

        if (adjustment.requestedByUserId === user.id) {
            return {
                allowed: false,
                code: 'SOD_SELF_APPROVAL_VIOLATION',
                reason: `Separation of Duties (SoD) Policy Violation: Requester (${user.name}) cannot approve their own stock adjustment.`
            };
        }

        const absVarianceCost = Math.abs(adjustment.costVariance || 0);
        if (user.approvalLimit !== undefined && absVarianceCost > user.approvalLimit) {
            return {
                allowed: false,
                code: 'APPROVAL_LIMIT_EXCEEDED',
                reason: `Threshold Exceeded: Adjustment value (₦${absVarianceCost.toLocaleString()}) exceeds your approval limit of ₦${(user.approvalLimit || 0).toLocaleString()}. Requires Director/Admin authorization.`
            };
        }

        return {
            allowed: true,
            code: 'AUTHORIZED',
            reason: `Authorized within delegated limit (₦${(user.approvalLimit || 0).toLocaleString()}).`
        };
    }

    /**
     * Strict Audit Trail Immutability Rule
     * Even System Administrators are barred by policy and cryptographic constraints.
     */
    function attemptAuditDeletion(reasonNotes) {
        const user = getActiveUser();
        const role = getActiveRole();

        // Log critical security breach event
        WOS_Data.recordAudit(
            user.id,
            role.id,
            "critical",
            "SECURITY_TAMPER_ATTEMPT",
            `SECURITY INCIDENT: User ${user.name} (${role.name}) attempted to delete or purge transaction history. Action blocked by Zero-Trust immutability guardrail. Notes: "${reasonNotes || 'No reason specified'}"`,
            { attemptedBy: user.email, userRole: role.name, timestamp: new Date().toISOString() }
        );

        return {
            allowed: false,
            title: "Access Denied: Immutable Ledger Violation",
            message: `WOS Policy Rule #SEC-01 Strictly Prohibits Audit Purging:\n\nAudit trails and transaction ledgers are cryptographically chained and immutable. Even users with role '${role.name}' cannot alter or delete past history.\n\nThis incident has been permanently written into the immutable security ledger.`
        };
    }

    /**
     * Switch current user persona
     */
    function switchUser(userId) {
        const state = WOS_Data.getState();
        const target = state.users.find(u => u.id === userId);
        if (!target) return false;

        const previousUser = state.activeUser;
        state.activeUser = target;
        WOS_Data.persist();

        WOS_Data.recordAudit(
            target.id,
            target.roleId,
            "info",
            "PERSONA_SWITCHED",
            `Active operator persona switched to ${target.name} (Role: ${target.roleId.toUpperCase()}, Scope: ${target.warehouseScope}) from ${previousUser ? previousUser.name : 'Unknown'}.`
        );

        return target;
    }

    /**
     * Guardrail function for buttons & actions
     */
    function guard(permission, successCallback, actionDescription) {
        const user = getActiveUser();
        const role = getActiveRole();

        if (hasPermission(permission)) {
            if (typeof successCallback === 'function') {
                return successCallback();
            }
            return true;
        } else {
            // Intercept & log unauthorized attempt
            WOS_Data.recordAudit(
                user.id,
                role.id,
                "warning",
                "UNAUTHORIZED_ACCESS_ATTEMPT",
                `Access Denied: User ${user.name} attempted '${actionDescription || permission}' without '${permission}' privilege.`
            );

            if (window.WOS_UI && window.WOS_UI.showToast) {
                window.WOS_UI.showToast(
                    `Permission Denied: Your active role (${role.name}) does not permit this action. Logged in audit trail.`,
                    'warning'
                );
            }
            return false;
        }
    }

    return {
        getActiveUser,
        getActiveRole,
        hasPermission,
        checkAdjustmentApprovalPolicy,
        attemptAuditDeletion,
        switchUser,
        guard
    };
})();

if (typeof window !== 'undefined') {
    window.WOS_RBAC = WOS_RBAC;
}
