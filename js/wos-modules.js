/**
 * Warehouse Operating System (WOS)
 * Core Operational Modules Implementation
 */

const WOS_Modules = (function () {

    // Helper to format currency
    function formatCurrency(amount, currency = 'NGN') {
        const sym = currency === 'NGN' ? '₦' : '$';
        const val = Number(amount) || 0;
        return `${sym}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Helper to format timestamps
    function formatTimestamp(isoStr) {
        if (!isoStr) return '—';
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // =========================================================================
    // 1. INVENTORY & ADJUSTMENTS MODULE
    // =========================================================================
    const Inventory = {
        getProducts() {
            return WOS_Data.getState().products;
        },

        getProductBySku(sku) {
            return WOS_Data.getState().products.find(p => p.sku === sku);
        },

        getBalances(warehouseId) {
            const state = WOS_Data.getState();
            let balances = state.inventoryBalances;
            if (warehouseId && warehouseId !== 'ALL') {
                balances = balances.filter(b => b.warehouseId === warehouseId);
            }
            return balances;
        },

        getTotalStockForSku(sku, warehouseId) {
            const balances = this.getBalances(warehouseId).filter(b => b.sku === sku);
            return balances.reduce((sum, b) => sum + (b.qtyAvailable || 0), 0);
        },

        addProduct(productData) {
            const state = WOS_Data.getState();
            if (state.products.find(p => p.sku === productData.sku)) {
                throw new Error(`Product with SKU "${productData.sku}" already exists.`);
            }

            state.products.unshift(productData);
            WOS_Data.persist();

            const user = WOS_RBAC.getActiveUser();
            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "PRODUCT_CREATED",
                `Created new product master SKU ${productData.sku} (${productData.name}). Category: ${productData.category}, Storage: ${productData.storageRequirement}.`
            );
            return productData;
        },

        requestAdjustment(sku, warehouseId, locationId, physicalQty, reasonCode, notes) {
            const state = WOS_Data.getState();
            const product = this.getProductBySku(sku);
            if (!product) throw new Error("Product SKU not found.");

            // Find current balance at this location
            let balance = state.inventoryBalances.find(b => b.sku === sku && b.warehouseId === warehouseId && b.locationId === locationId);
            const prevQty = balance ? balance.qtyAvailable : 0;
            const variance = physicalQty - prevQty;
            const costVariance = variance * product.costPrice;

            const user = WOS_RBAC.getActiveUser();
            const newAdjId = `ADJ-${new Date().getFullYear()}-${String(state.adjustments.length + 44).padStart(4, '0')}`;

            const adjustment = {
                id: newAdjId,
                sku,
                warehouseId,
                locationId,
                prevQty,
                targetQty: physicalQty,
                variance,
                costVariance,
                requestedByUserId: user.id,
                requestedByName: `${user.name} (${WOS_RBAC.getActiveRole().name})`,
                approvedByUserId: null,
                approvedByName: null,
                reasonCode,
                evidenceNotes: notes || "Discrepancy identified during floor verification.",
                status: "Pending",
                createdAt: new Date().toISOString(),
                approvedAt: null
            };

            state.adjustments.unshift(adjustment);
            WOS_Data.persist();

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "ADJUSTMENT_REQUESTED",
                `Raised Stock Adjustment ${adjustment.id} on ${sku} at ${locationId}. Variance: ${variance > 0 ? '+' : ''}${variance} units (${formatCurrency(costVariance)}). Status: Pending Approval.`,
                adjustment
            );

            return adjustment;
        },

        approveAdjustment(adjustmentId) {
            const state = WOS_Data.getState();
            const adj = state.adjustments.find(a => a.id === adjustmentId);
            if (!adj) throw new Error("Adjustment not found.");
            if (adj.status !== "Pending") throw new Error(`Adjustment is already ${adj.status}.`);

            // Validate Separation of Duties (SoD)
            const sodCheck = WOS_RBAC.checkAdjustmentApprovalPolicy(adj);
            if (!sodCheck.allowed) {
                const user = WOS_RBAC.getActiveUser();
                WOS_Data.recordAudit(
                    user.id,
                    user.roleId,
                    "warning",
                    "SOD_VIOLATION_INTERCEPTED",
                    `Denied Approval Attempt for ${adj.id}: ${sodCheck.reason}`
                );
                throw new Error(sodCheck.reason);
            }

            const approver = WOS_RBAC.getActiveUser();
            adj.status = "Approved";
            adj.approvedByUserId = approver.id;
            adj.approvedByName = `${approver.name} (${WOS_RBAC.getActiveRole().name})`;
            adj.approvedAt = new Date().toISOString();

            // Apply stock adjustment to balance
            let balance = state.inventoryBalances.find(b => b.sku === adj.sku && b.warehouseId === adj.warehouseId && b.locationId === adj.locationId);
            if (!balance) {
                balance = {
                    id: state.inventoryBalances.length + 1,
                    sku: adj.sku,
                    warehouseId: adj.warehouseId,
                    locationId: adj.locationId,
                    qtyAvailable: adj.targetQty,
                    qtyReserved: 0,
                    qtyAllocated: 0,
                    qtyDamaged: 0
                };
                state.inventoryBalances.push(balance);
            } else {
                balance.qtyAvailable = adj.targetQty;
            }

            // Record immutable stock movement in ledger
            WOS_Data.recordStockMovement(
                adj.sku,
                adj.warehouseId,
                adj.locationId,
                adj.prevQty,
                adj.variance,
                "Adjustment",
                approver.id,
                approver.name,
                adj.id
            );

            // Record audit log
            WOS_Data.recordAudit(
                approver.id,
                approver.roleId,
                "success",
                "ADJUSTMENT_APPROVED",
                `Approved Stock Adjustment ${adj.id} for ${adj.sku}. Net variance of ${adj.variance} applied. Ledger balance updated to ${adj.targetQty}.`,
                adj
            );

            WOS_Data.persist();
            return adj;
        },

        rejectAdjustment(adjustmentId, reason) {
            const state = WOS_Data.getState();
            const adj = state.adjustments.find(a => a.id === adjustmentId);
            if (!adj) throw new Error("Adjustment not found.");

            const reviewer = WOS_RBAC.getActiveUser();
            adj.status = "Rejected";
            adj.approvedByUserId = reviewer.id;
            adj.approvedByName = `${reviewer.name} (Rejected: ${reason || 'Inconclusive count'})`;
            adj.approvedAt = new Date().toISOString();

            WOS_Data.recordAudit(
                reviewer.id,
                reviewer.roleId,
                "warning",
                "ADJUSTMENT_REJECTED",
                `Rejected Stock Adjustment ${adj.id} by ${reviewer.name}. Reason: ${reason || 'Inconclusive evidence'}.`,
                adj
            );

            WOS_Data.persist();
            return adj;
        }
    };

    // =========================================================================
    // 2. INBOUND RECEIVING MODULE
    // =========================================================================
    const Receiving = {
        getPurchaseOrders(warehouseId) {
            const state = WOS_Data.getState();
            let pos = state.purchaseOrders;
            if (warehouseId && warehouseId !== 'ALL') {
                pos = pos.filter(po => po.warehouseId === warehouseId);
            }
            return pos;
        },

        getPOById(poId) {
            return WOS_Data.getState().purchaseOrders.find(po => po.id === poId);
        },

        createPO(supplierName, warehouseId, etaDate, items) {
            const state = WOS_Data.getState();
            const poId = `PO-${new Date().getFullYear()}-${String(state.purchaseOrders.length + 893).padStart(4, '0')}`;
            const newPO = {
                id: poId,
                supplierName,
                warehouseId,
                status: "Expected",
                etaDate: etaDate || new Date().toISOString().split('T')[0],
                createdDate: new Date().toISOString().split('T')[0],
                items: items.map(item => ({
                    sku: item.sku,
                    expectedQty: Number(item.expectedQty) || 1,
                    receivedQty: 0,
                    damagedQty: 0,
                    unitCost: item.unitCost || 10000
                }))
            };

            state.purchaseOrders.unshift(newPO);
            WOS_Data.persist();

            const user = WOS_RBAC.getActiveUser();
            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "PO_CREATED",
                `Created Inbound Purchase Order ${newPO.id} from supplier "${supplierName}" with ${items.length} line item(s).`
            );

            return newPO;
        },

        receiveItem(poId, sku, goodQty, damagedQty) {
            const state = WOS_Data.getState();
            const po = state.purchaseOrders.find(p => p.id === poId);
            if (!po) throw new Error("Purchase order not found.");

            const line = po.items.find(i => i.sku === sku);
            if (!line) throw new Error(`SKU ${sku} is not listed on this Purchase Order.`);

            const user = WOS_RBAC.getActiveUser();
            goodQty = Number(goodQty) || 0;
            damagedQty = Number(damagedQty) || 0;

            if (goodQty + damagedQty <= 0) {
                throw new Error("Receipt quantity must be greater than zero.");
            }

            line.receivedQty += goodQty;
            line.damagedQty += damagedQty;
            po.status = "Receiving";

            // Check if all items fully received
            const allComplete = po.items.every(i => (i.receivedQty + i.damagedQty) >= i.expectedQty);
            if (allComplete) {
                po.status = "Completed";
            }

            // Inbound items initially land in Inbound Staging Bay
            const stagingBin = "WH01-STG-INBOUND-01";
            let stagingBalance = state.inventoryBalances.find(b => b.sku === sku && b.warehouseId === po.warehouseId && b.locationId === stagingBin);
            const prevStagingQty = stagingBalance ? stagingBalance.qtyAvailable : 0;

            if (!stagingBalance) {
                stagingBalance = {
                    id: state.inventoryBalances.length + 1,
                    sku: sku,
                    warehouseId: po.warehouseId,
                    locationId: stagingBin,
                    qtyAvailable: goodQty,
                    qtyReserved: 0,
                    qtyAllocated: 0,
                    qtyDamaged: damagedQty
                };
                state.inventoryBalances.push(stagingBalance);
            } else {
                stagingBalance.qtyAvailable += goodQty;
                stagingBalance.qtyDamaged += damagedQty;
            }

            // Record movement in Ledger
            WOS_Data.recordStockMovement(
                sku,
                po.warehouseId,
                stagingBin,
                prevStagingQty,
                goodQty,
                "Receiving",
                user.id,
                user.name,
                po.id
            );

            // Automatically generate Put-Away Task for Good Inventory
            if (goodQty > 0) {
                const putawayTask = PutAway.createTaskForReceipt(po.id, sku, goodQty, po.warehouseId, stagingBin);
            }

            // If there's damaged quantity, route to Quarantine staging
            if (damagedQty > 0) {
                const quarBin = "WH01-QUR-A01-R01-S01-B01";
                WOS_Data.recordAudit(
                    user.id,
                    user.roleId,
                    "warning",
                    "INBOUND_DAMAGE_DETECTED",
                    `Flagged ${damagedQty} damaged units for ${sku} during receipt of ${po.id}. Routing to Quarantine Bay ${quarBin}.`
                );
            }

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "success",
                "GOODS_RECEIVED",
                `Received ${goodQty} units (Good) and ${damagedQty} units (Damaged) for ${sku} on PO ${po.id}. Staged at ${stagingBin}.`
            );

            WOS_Data.persist();
            return { po, line };
        }
    };

    // =========================================================================
    // 3. PUT-AWAY MODULE
    // =========================================================================
    const PutAway = {
        getTasks(warehouseId) {
            const state = WOS_Data.getState();
            let tasks = state.putawayTasks;
            if (warehouseId && warehouseId !== 'ALL') {
                // Filter by warehouse locations
                const whBins = state.locations.filter(l => l.warehouseId === warehouseId).map(l => l.id);
                tasks = tasks.filter(t => whBins.includes(t.recommendedLocationId) || whBins.includes(t.sourceLocationId));
            }
            return tasks;
        },

        recommendBin(sku, warehouseId, requiredQty = 1) {
            const state = WOS_Data.getState();
            const product = Inventory.getProductBySku(sku);
            const targetZoneId = product ? product.targetZone : "Z-AMB";

            // Find all active bins in the target zone with capacity available
            const candidateBins = state.locations.filter(loc =>
                loc.warehouseId === warehouseId &&
                loc.zoneId === targetZoneId &&
                loc.status === "Active" &&
                (loc.capacityUnits - loc.occupiedUnits) >= requiredQty
            );

            if (candidateBins.length > 0) {
                // Sort by least occupied to balance load
                candidateBins.sort((a, b) => a.occupiedUnits - b.occupiedUnits);
                return candidateBins[0].id;
            }

            // Fallback to any ambient bin if special zone is full
            const ambientFallback = state.locations.find(loc =>
                loc.warehouseId === warehouseId &&
                loc.zoneId === "Z-AMB" &&
                loc.status === "Active" &&
                (loc.capacityUnits - loc.occupiedUnits) >= requiredQty
            );

            return ambientFallback ? ambientFallback.id : "WH01-AMB-A01-R01-S01-B01";
        },

        createTaskForReceipt(poId, sku, qty, warehouseId, sourceLocationId) {
            const state = WOS_Data.getState();
            const taskId = `PUT-${String(state.putawayTasks.length + 106).padStart(5, '0')}`;
            const recommendedBin = this.recommendBin(sku, warehouseId, qty);
            const user = WOS_RBAC.getActiveUser();

            const task = {
                id: taskId,
                poId,
                sku,
                qty,
                sourceLocationId: sourceLocationId || "WH01-STG-INBOUND-01",
                recommendedLocationId: recommendedBin,
                assignedUserId: user.id,
                assignedUserName: user.name,
                status: "Pending",
                priority: "Normal",
                createdAt: new Date().toISOString()
            };

            state.putawayTasks.unshift(task);
            return task;
        },

        executePutAway(taskId, targetLocationId) {
            const state = WOS_Data.getState();
            const task = state.putawayTasks.find(t => t.id === taskId);
            if (!task) throw new Error("Put-away task not found.");
            if (task.status === "Completed") throw new Error("Task already completed.");

            const destinationBin = targetLocationId || task.recommendedLocationId;
            const user = WOS_RBAC.getActiveUser();

            // 1. Decrement staging balance
            const staging = state.inventoryBalances.find(b => b.sku === task.sku && b.locationId === task.sourceLocationId);
            if (staging) {
                staging.qtyAvailable = Math.max(0, staging.qtyAvailable - task.qty);
            }

            // 2. Increment destination bin balance
            let targetBal = state.inventoryBalances.find(b => b.sku === task.sku && b.locationId === destinationBin);
            const prevDestQty = targetBal ? targetBal.qtyAvailable : 0;
            if (!targetBal) {
                targetBal = {
                    id: state.inventoryBalances.length + 1,
                    sku: task.sku,
                    warehouseId: "WH-LOS-01",
                    locationId: destinationBin,
                    qtyAvailable: task.qty,
                    qtyReserved: 0,
                    qtyAllocated: 0,
                    qtyDamaged: 0
                };
                state.inventoryBalances.push(targetBal);
            } else {
                targetBal.qtyAvailable += task.qty;
            }

            // 3. Update bin occupancy counter
            const binObj = state.locations.find(l => l.id === destinationBin);
            if (binObj) {
                binObj.occupiedUnits = Math.min(binObj.capacityUnits, binObj.occupiedUnits + task.qty);
            }

            task.status = "Completed";
            task.completedAt = new Date().toISOString();

            // 4. Record stock movement
            WOS_Data.recordStockMovement(
                task.sku,
                "WH-LOS-01",
                destinationBin,
                prevDestQty,
                task.qty,
                "Put-away",
                user.id,
                user.name,
                task.id
            );

            // 5. Audit log
            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "success",
                "PUTAWAY_COMPLETED",
                `Completed Put-Away ${task.id}. Transferred ${task.qty} units of ${task.sku} from Staging to Storage Bin ${destinationBin}.`
            );

            WOS_Data.persist();
            return task;
        }
    };

    // =========================================================================
    // 4. PICKING MODULE (OUTBOUND)
    // =========================================================================
    const Picking = {
        getOrders(warehouseId) {
            const state = WOS_Data.getState();
            let orders = state.orders;
            if (warehouseId && warehouseId !== 'ALL') {
                orders = orders.filter(o => o.warehouseId === warehouseId);
            }
            return orders;
        },

        getOrderById(orderId) {
            return WOS_Data.getState().orders.find(o => o.id === orderId);
        },

        getPickingTasks() {
            return WOS_Data.getState().pickingTasks;
        },

        createOrder(customerName, destination, warehouseId, items, courier) {
            const state = WOS_Data.getState();
            const orderId = `ORD-NG-2026-${String(state.orders.length + 773).padStart(3, '0')}`;
            const user = WOS_RBAC.getActiveUser();

            const order = {
                id: orderId,
                customerName,
                destination,
                warehouseId,
                status: "Allocated",
                priority: "Normal",
                courier: courier || "GIG Logistics",
                trackingNumber: "TRK-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                createdAt: new Date().toISOString(),
                items: items.map(item => {
                    // find bin with available stock
                    const bal = state.inventoryBalances.find(b => b.sku === item.sku && b.qtyAvailable >= item.qty) ||
                                state.inventoryBalances.find(b => b.sku === item.sku);
                    const bin = bal ? bal.locationId : "WH01-AMB-A01-R01-S01-B01";

                    // reserve quantity
                    if (bal) {
                        bal.qtyReserved = (bal.qtyReserved || 0) + item.qty;
                        bal.qtyAllocated = (bal.qtyAllocated || 0) + item.qty;
                    }

                    return {
                        sku: item.sku,
                        qty: Number(item.qty),
                        pickedQty: 0,
                        packedQty: 0,
                        locationId: bin
                    };
                })
            };

            state.orders.unshift(order);

            // Automatically generate picking tasks for each item
            order.items.forEach((it, idx) => {
                const pckTask = {
                    id: `PCK-${String(state.pickingTasks.length + 8805 + idx)}`,
                    orderId: order.id,
                    sku: it.sku,
                    locationId: it.locationId,
                    qty: it.qty,
                    pickedQty: 0,
                    assignedUserId: user.id,
                    status: "Assigned"
                };
                state.pickingTasks.unshift(pckTask);
            });

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "ORDER_CREATED",
                `Created Outbound Order ${order.id} for "${customerName}". Stock allocated and pick tasks assigned.`
            );

            WOS_Data.persist();
            return order;
        },

        confirmPick(pickingTaskId, quantityPicked) {
            const state = WOS_Data.getState();
            const task = state.pickingTasks.find(t => t.id === pickingTaskId);
            if (!task) throw new Error("Picking task not found.");

            const order = state.orders.find(o => o.id === task.orderId);
            if (!order) throw new Error("Associated order not found.");

            const user = WOS_RBAC.getActiveUser();
            const pickQty = Number(quantityPicked) || task.qty;

            task.pickedQty = pickQty;
            task.status = "Completed";

            // Update order item picked counter
            const ordItem = order.items.find(i => i.sku === task.sku);
            if (ordItem) {
                ordItem.pickedQty = pickQty;
            }

            // Decrement inventory balance at the bin
            const bal = state.inventoryBalances.find(b => b.sku === task.sku && b.locationId === task.locationId);
            const prevQty = bal ? bal.qtyAvailable : 0;
            if (bal) {
                bal.qtyAvailable = Math.max(0, bal.qtyAvailable - pickQty);
                bal.qtyReserved = Math.max(0, (bal.qtyReserved || 0) - pickQty);
            }

            // Decrement physical bin occupancy
            const binLoc = state.locations.find(l => l.id === task.locationId);
            if (binLoc) {
                binLoc.occupiedUnits = Math.max(0, binLoc.occupiedUnits - pickQty);
            }

            // Update order status if all items picked
            const allPicked = order.items.every(i => i.pickedQty >= i.qty);
            if (allPicked) {
                order.status = "Picked";
            } else {
                order.status = "Picking";
            }

            // Record movement in Ledger
            WOS_Data.recordStockMovement(
                task.sku,
                order.warehouseId,
                task.locationId,
                prevQty,
                -pickQty,
                "Pick",
                user.id,
                user.name,
                order.id
            );

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "ORDER_PICKED",
                `Confirmed pick of ${pickQty} units of ${task.sku} from ${task.locationId} for Order ${order.id}.`
            );

            WOS_Data.persist();
            return task;
        }
    };

    // =========================================================================
    // 5. PACKING & DISPATCH MODULE
    // =========================================================================
    const Dispatch = {
        packOrder(orderId, boxType, weightKg) {
            const state = WOS_Data.getState();
            const order = state.orders.find(o => o.id === orderId);
            if (!order) throw new Error("Order not found.");

            const user = WOS_RBAC.getActiveUser();
            order.items.forEach(it => {
                it.packedQty = it.pickedQty;
            });
            order.status = "Packed";
            order.packingDetails = {
                boxType: boxType || "Standard Heavy Duty Corrugated Carton",
                weightKg: Number(weightKg) || 12.5,
                packedBy: user.name,
                packedAt: new Date().toISOString()
            };

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "ORDER_PACKED",
                `Packed Order ${order.id}. Container: ${order.packingDetails.boxType}, Total Weight: ${order.packingDetails.weightKg}kg.`
            );

            WOS_Data.persist();
            return order;
        },

        authorizeDispatch(orderId, courier, trackingNo) {
            const state = WOS_Data.getState();
            const order = state.orders.find(o => o.id === orderId);
            if (!order) throw new Error("Order not found.");

            // Supervisor or Ops Manager authorization check
            if (!WOS_RBAC.hasPermission("dispatch.approve") && !WOS_RBAC.hasPermission("dispatch.process")) {
                throw new Error("Access Denied: Only Warehouse Supervisors and Operations Managers can authorize final dispatch gate release.");
            }

            const user = WOS_RBAC.getActiveUser();
            order.status = "Dispatched";
            order.courier = courier || order.courier;
            order.trackingNumber = trackingNo || order.trackingNumber;
            order.dispatchedAt = new Date().toISOString();
            order.authorizedBy = `${user.name} (${WOS_RBAC.getActiveRole().name})`;

            // Ledger entry
            order.items.forEach(it => {
                WOS_Data.recordStockMovement(
                    it.sku,
                    order.warehouseId,
                    "GATE-OUTBOUND-DOCK",
                    it.qty,
                    -it.qty,
                    "Dispatch",
                    user.id,
                    user.name,
                    order.id
                );
            });

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "success",
                "ORDER_DISPATCHED",
                `Authorized Outbound Dispatch release for ${order.id} via ${order.courier} (Tracking: ${order.trackingNumber}). Gate pass stamped.`
            );

            WOS_Data.persist();
            return order;
        }
    };

    // =========================================================================
    // 6. RETURNS MODULE (REVERSE LOGISTICS)
    // =========================================================================
    const Returns = {
        getReturns() {
            return WOS_Data.getState().returns;
        },

        processReturn(orderId, sku, qty, reasonCode, triageDisposition, notes) {
            const state = WOS_Data.getState();
            const rmaId = `RMA-${new Date().getFullYear()}-${String(state.returns.length + 13).padStart(3, '0')}`;
            const user = WOS_RBAC.getActiveUser();
            const product = Inventory.getProductBySku(sku);

            qty = Number(qty) || 1;

            let routedZone = "Z-QUAR";
            let targetBin = "WH01-QUR-A01-R01-S01-B01";

            if (triageDisposition === "Restocked") {
                routedZone = product ? product.targetZone : "Z-AMB";
                targetBin = PutAway.recommendBin(sku, "WH-LOS-01", qty);

                // Add back to inventory
                let bal = state.inventoryBalances.find(b => b.sku === sku && b.locationId === targetBin);
                const prev = bal ? bal.qtyAvailable : 0;
                if (!bal) {
                    bal = {
                        id: state.inventoryBalances.length + 1,
                        sku,
                        warehouseId: "WH-LOS-01",
                        locationId: targetBin,
                        qtyAvailable: qty,
                        qtyReserved: 0,
                        qtyAllocated: 0,
                        qtyDamaged: 0
                    };
                    state.inventoryBalances.push(bal);
                } else {
                    bal.qtyAvailable += qty;
                }

                WOS_Data.recordStockMovement(
                    sku,
                    "WH-LOS-01",
                    targetBin,
                    prev,
                    qty,
                    "Return",
                    user.id,
                    user.name,
                    rmaId
                );
            } else if (triageDisposition === "Quarantined") {
                routedZone = "Z-QUAR";
                targetBin = "WH01-QUR-A01-R01-S01-B01";

                let bal = state.inventoryBalances.find(b => b.sku === sku && b.locationId === targetBin);
                if (!bal) {
                    bal = {
                        id: state.inventoryBalances.length + 1,
                        sku,
                        warehouseId: "WH-LOS-01",
                        locationId: targetBin,
                        qtyAvailable: 0,
                        qtyReserved: 0,
                        qtyAllocated: 0,
                        qtyDamaged: qty
                    };
                    state.inventoryBalances.push(bal);
                } else {
                    bal.qtyDamaged += qty;
                }
            }

            const rma = {
                id: rmaId,
                orderId,
                sku,
                qty,
                customerName: "Customer Direct Return",
                reasonCode,
                triageDisposition,
                inspectedByUserId: user.id,
                inspectedByName: user.name,
                routedZoneId: routedZone,
                targetLocationId: targetBin,
                notes: notes || "Inspected on receiving dock.",
                status: "Processed",
                createdAt: new Date().toISOString()
            };

            state.returns.unshift(rma);

            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "RMA_PROCESSED",
                `Processed Return RMA ${rma.id} for Order ${orderId}. Disposition: ${triageDisposition} (${qty} units of ${sku} routed to ${targetBin}).`
            );

            WOS_Data.persist();
            return rma;
        }
    };

    // =========================================================================
    // 7. SAAS SUBSCRIPTION & BILLING CALCULATOR
    // =========================================================================
    const Billing = {
        getSubscription() {
            return WOS_Data.getState().saasSubscription;
        },

        calculatePricing(tierName, warehouseCount, userCount, interval = 'Monthly') {
            const tiers = {
                "Starter Tier": { base: 99, maxWH: 2, maxUsers: 5, extraWH: 49, extraUser: 15 },
                "Growth Tier": { base: 249, maxWH: 5, maxUsers: 20, extraWH: 49, extraUser: 15 },
                "Enterprise Tier": { base: 499, maxWH: 15, maxUsers: 100, extraWH: 39, extraUser: 12 }
            };

            const selected = tiers[tierName] || tiers["Growth Tier"];
            const baseCost = selected.base;
            const whCost = warehouseCount * selected.extraWH;
            const userCost = userCount * selected.extraUser;
            let subtotal = baseCost + whCost + userCost;

            let discount = 0;
            if (interval === 'Annual') {
                discount = subtotal * 0.20; // 20% discount on annual plans
            }
            const total = subtotal - discount;

            return {
                tierName,
                baseCost,
                warehouseCount,
                whCost,
                userCount,
                userCost,
                subtotal,
                discount,
                total,
                interval
            };
        },

        updatePlan(tierName, interval) {
            const state = WOS_Data.getState();
            const sub = state.saasSubscription;
            sub.planName = tierName;
            sub.billingInterval = interval;

            const calc = this.calculatePricing(tierName, sub.activeWarehouses, sub.activeUsers, interval);
            sub.nextInvoiceAmount = calc.total;

            const user = WOS_RBAC.getActiveUser();
            WOS_Data.recordAudit(
                user.id,
                user.roleId,
                "info",
                "SUBSCRIPTION_UPDATED",
                `Updated SaaS Subscription to ${tierName} (${interval} billing). Monthly/Annualized rate: $${calc.total}.`
            );

            WOS_Data.persist();
            return sub;
        }
    };

    return {
        formatCurrency,
        formatTimestamp,
        Inventory,
        Receiving,
        PutAway,
        Picking,
        Dispatch,
        Returns,
        Billing
    };
})();

if (typeof window !== 'undefined') {
    window.WOS_Modules = WOS_Modules;
}
