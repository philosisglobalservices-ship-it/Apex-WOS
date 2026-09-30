/**
 * Warehouse Operating System (WOS)
 * Application Bootstrapper & Lifecycle Controller
 */

(function () {
    console.log("⚡ Initializing Enterprise Warehouse Operating System (WOS)...");

    document.addEventListener('DOMContentLoaded', function () {
        try {
            // Verify core dependencies
            if (typeof WOS_Data === 'undefined' || typeof WOS_RBAC === 'undefined' || typeof WOS_UI === 'undefined') {
                console.error("WOS Core components failed to load. Check script loading order.");
                return;
            }

            // Sync Header Telemetry with Active Persona & Warehouse
            WOS_UI.updateHeaderTelemetry();

            // Initialize and verify Supabase Cloud Database Connection
            if (typeof WOS_Supabase !== 'undefined') {
                WOS_Supabase.init();
                WOS_UI.updateSupabaseTelemetryUI();
                // Perform quick non-blocking background connection check
                WOS_Supabase.testConnection().then(() => {
                    WOS_UI.updateSupabaseTelemetryUI();
                }).catch(() => {});
            }

            // Default landing view: Inventory Balances & SoD
            WOS_UI.switchTab('inventory');

            // Keyboard shortcuts for warehouse speed
            document.addEventListener('keydown', function (e) {
                // Ignore shortcuts if typing in input or textarea
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                    if (e.key === 'Escape') {
                        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
                    }
                    return;
                }

                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    WOS_UI.openBarcodeModal();
                } else if (e.key === 'Escape') {
                    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
                }
            });

            console.log("✓ Enterprise WOS successfully booted. Zero-Trust RBAC & Cryptographic Ledger active.");
        } catch (err) {
            console.error("Error during WOS bootstrap:", err);
        }
    });
})();
