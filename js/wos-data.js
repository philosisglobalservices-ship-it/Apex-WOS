/**
 * Warehouse Operating System (WOS)
 * Core Data Engine, Storage, Seed Database & Cryptographic Hash Chaining
 */

const WOS_Data = (function () {
    const STORAGE_KEY = 'WOS_ENTERPRISE_STATE_V1';

    // Simple, synchronous cryptographic hash function (SHA-256 equivalent for tamper-evident chains)
    function sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;
        var result = '';
        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;
        var hash = sha256.h = sha256.h || [];
        var k = sha256.k = sha256.k || [];
        var primeCounter = k[lengthProperty];

        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 300; i += candidate) {
                    isComposite[i] = candidate;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }

        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return;
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength) | 0;

        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16);
            var oldHash = hash;
            hash = hash.slice(0, 8);

            for (i = 0; i < 64; i++) {
                var w15 = w[i - 15], w2 = w[i - 2];
                var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
                var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
                var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
                var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
                var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
                var temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;

                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }
            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }
        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    }

    // Default Enterprise Seed State
    function generateSeedState() {
        const genesisTimestamp = new Date(Date.now() - 86400000 * 7).toISOString();
        const genesisHash = sha256("GENESIS_BLOCK_WOS_SYSTEM_V1_INIT_" + genesisTimestamp);

        const company = {
            id: "COMP-001",
            name: "Apex Global Supply Chain Ltd.",
            legalEntity: "Apex Holdings LLC",
            taxId: "NG-RC-88492019-TX",
            defaultCurrency: "NGN",
            currencySymbol: "₦",
            industry: "Multi-Client Contract Logistics & Distribution",
            address: "Plot 14 Commercial Avenue, Victoria Island, Lagos, Nigeria",
            contactEmail: "ops-lead@apexlogistics.com",
            subscriptionTier: "Enterprise",
            activeWarehousesCount: 4,
            activeUsersCount: 6,
            maxWarehouses: 10,
            maxUsers: 50,
            saasMonthlyRate: 499,
            billingCycle: "Monthly",
            nextBillingDate: "2026-10-01"
        };

        const branches = [
            {
                id: "BR-LOS",
                name: "Lagos Coastal Distribution Hub",
                code: "LOS-HUB",
                region: "South-West Nigeria",
                city: "Lagos",
                manager: "Sarah Jenkins",
                phone: "+234 1 450 8920",
                address: "Plot 8 Ikeja Industrial Layout, Lagos",
                active: true,
                warehouseIds: ["WH-LOS-01", "WH-LOS-02"]
            },
            {
                id: "BR-ABJ",
                name: "Abuja Central Fulfillment Depot",
                code: "ABJ-DEP",
                region: "North-Central Nigeria",
                city: "Abuja",
                manager: "Chinedu Okafor",
                phone: "+234 9 881 2300",
                address: "Sector 4, Idu Industrial Zone, Abuja FCT",
                active: true,
                warehouseIds: ["WH-ABJ-01"]
            },
            {
                id: "BR-PHC",
                name: "Port Harcourt Maritime Gateway",
                code: "PHC-GTW",
                region: "South-South Nigeria",
                city: "Port Harcourt",
                manager: "Marcus Vance",
                phone: "+234 84 330 901",
                address: "Trans-Amadi Industrial Complex, Port Harcourt",
                active: true,
                warehouseIds: ["WH-PHC-01"]
            }
        ];

        const warehouses = [
            {
                id: "WH-LOS-01",
                branchId: "BR-LOS",
                name: "Apex Ikeja Mega-Warehouse",
                type: "Regional Distribution Center",
                address: "Plot 8 Ikeja Industrial Layout, Lagos",
                totalCapacityUnits: 5000,
                occupiedUnits: 3420,
                status: "Active",
                zones: ["Z-AMB", "Z-COLD", "Z-HAZ", "Z-QUAR", "Z-STG", "Z-RET"]
            },
            {
                id: "WH-LOS-02",
                branchId: "BR-LOS",
                name: "Apapa Port Cold-Chain Facility",
                type: "Cold Storage & Quarantine Facility",
                address: "Wharf Road, Apapa Maritime Area, Lagos",
                totalCapacityUnits: 2000,
                occupiedUnits: 1250,
                status: "Active",
                zones: ["Z-COLD", "Z-QUAR", "Z-STG"]
            },
            {
                id: "WH-ABJ-01",
                branchId: "BR-ABJ",
                name: "Idu Central Fulfillment Center",
                type: "E-Commerce & High Velocity Depot",
                address: "Idu Industrial Layout, Abuja",
                totalCapacityUnits: 3500,
                occupiedUnits: 2180,
                status: "Active",
                zones: ["Z-AMB", "Z-STG", "Z-QUAR"]
            },
            {
                id: "WH-PHC-01",
                branchId: "BR-PHC",
                name: "Delta Oil & Gas Logistics Depot",
                type: "Heavy Industrial & Chemical Depot",
                address: "Trans-Amadi, Port Harcourt",
                totalCapacityUnits: 4000,
                occupiedUnits: 1950,
                status: "Active",
                zones: ["Z-AMB", "Z-HAZ", "Z-STG"]
            }
        ];

        const zones = [
            { id: "Z-AMB", name: "Ambient Storage Zone", type: "Standard", tempRange: "18°C - 25°C", capacity: 3000, description: "Dry goods, general merchandise, non-perishables" },
            { id: "Z-COLD", name: "Cold-Chain Reefer Zone", type: "Cold", tempRange: "2°C - 8°C", capacity: 800, description: "Vaccines, pharmaceuticals, temperature-sensitive food" },
            { id: "Z-HAZ", name: "Hazardous & Flammables Zone", type: "Hazardous", tempRange: "Ambient Fire-Safe", capacity: 400, description: "Chemicals, flammable lubricants, industrial paints" },
            { id: "Z-QUAR", name: "Quarantine & Inspection Bay", type: "Quarantine", tempRange: "Controlled", capacity: 300, description: "Damaged returns, uninspected inbound, recalled lots" },
            { id: "Z-STG", name: "Inbound/Outbound Staging Bay", type: "Staging", tempRange: "Cross-dock", capacity: 500, description: "Pre-dispatch pallet consolidation & receiving dock" },
            { id: "Z-RET", name: "Reverse Logistics & Returns", type: "Returns", tempRange: "Ambient", capacity: 400, description: "RMA processing, inspection triage & re-labeling" }
        ];

        // Generate fine-grained Bins for WH-LOS-01
        const locations = [];
        const aisles = ["A01", "A02", "A03", "A04"];
        const racks = ["R01", "R02"];
        const shelves = ["S01", "S02"];
        const binsList = ["B01", "B02"];

        // Ambient bins
        aisles.forEach(aisle => {
            racks.forEach(rack => {
                shelves.forEach(shelf => {
                    binsList.forEach(bin => {
                        const binId = `WH01-AMB-${aisle}-${rack}-${shelf}-${bin}`;
                        locations.push({
                            id: binId,
                            warehouseId: "WH-LOS-01",
                            zoneId: "Z-AMB",
                            aisle, rack, shelf, bin,
                            capacityUnits: 100,
                            occupiedUnits: Math.floor(Math.random() * 65) + 15,
                            status: "Active",
                            barcode: "LOC-" + binId
                        });
                    });
                });
            });
        });

        // Cold Zone bins
        ["A01", "A02"].forEach(aisle => {
            ["R01"].forEach(rack => {
                ["S01", "S02"].forEach(shelf => {
                    ["B01", "B02"].forEach(bin => {
                        const binId = `WH01-CLD-${aisle}-${rack}-${shelf}-${bin}`;
                        locations.push({
                            id: binId,
                            warehouseId: "WH-LOS-01",
                            zoneId: "Z-COLD",
                            aisle, rack, shelf, bin,
                            capacityUnits: 80,
                            occupiedUnits: Math.floor(Math.random() * 50) + 10,
                            status: "Active",
                            barcode: "LOC-" + binId
                        });
                    });
                });
            });
        });

        // Hazardous Bins
        ["A01"].forEach(aisle => {
            ["R01", "R02"].forEach(rack => {
                ["S01"].forEach(shelf => {
                    ["B01", "B02"].forEach(bin => {
                        const binId = `WH01-HAZ-${aisle}-${rack}-${shelf}-${bin}`;
                        locations.push({
                            id: binId,
                            warehouseId: "WH-LOS-01",
                            zoneId: "Z-HAZ",
                            aisle, rack, shelf, bin,
                            capacityUnits: 60,
                            occupiedUnits: Math.floor(Math.random() * 40) + 5,
                            status: "Active",
                            barcode: "LOC-" + binId
                        });
                    });
                });
            });
        });

        // Quarantine Bins
        locations.push(
            { id: "WH01-QUR-A01-R01-S01-B01", warehouseId: "WH-LOS-01", zoneId: "Z-QUAR", aisle: "A01", rack: "R01", shelf: "S01", bin: "B01", capacityUnits: 100, occupiedUnits: 32, status: "Active", barcode: "LOC-WH01-QUR-01" },
            { id: "WH01-QUR-A01-R01-S01-B02", warehouseId: "WH-LOS-01", zoneId: "Z-QUAR", aisle: "A01", rack: "R01", shelf: "S01", bin: "B02", capacityUnits: 100, occupiedUnits: 45, status: "Active", barcode: "LOC-WH01-QUR-02" }
        );

        // Staging Bay Bins
        locations.push(
            { id: "WH01-STG-INBOUND-01", warehouseId: "WH-LOS-01", zoneId: "Z-STG", aisle: "DOCK", rack: "IN", shelf: "01", bin: "BAY", capacityUnits: 250, occupiedUnits: 90, status: "Active", barcode: "LOC-WH01-STG-IN-01" },
            { id: "WH01-STG-OUTBOUND-01", warehouseId: "WH-LOS-01", zoneId: "Z-STG", aisle: "DOCK", rack: "OUT", shelf: "01", bin: "BAY", capacityUnits: 250, occupiedUnits: 120, status: "Active", barcode: "LOC-WH01-STG-OUT-01" }
        );

        // Roles & Granular Permissions Matrix
        const roles = [
            {
                id: "admin",
                name: "System Administrator",
                badge: "SYSTEM ADMIN",
                color: "rose",
                description: "Full configuration and tenant administration. Can invite users and assign roles. Strictly barred from deleting or altering audit logs.",
                permissions: [
                    "company.view", "company.edit",
                    "branches.view", "branches.edit",
                    "warehouses.view", "warehouses.edit",
                    "users.view", "users.edit", "users.delete",
                    "roles.view", "roles.edit",
                    "inventory.view", "inventory.adjust_request",
                    "receiving.view", "receiving.process",
                    "putaway.view", "putaway.process",
                    "picking.view", "picking.process",
                    "dispatch.view", "dispatch.process",
                    "returns.view", "returns.process",
                    "reports.view", "reports.export",
                    "audit.view",
                    "billing.view", "billing.edit"
                ]
            },
            {
                id: "supervisor",
                name: "Warehouse Supervisor",
                badge: "SUPERVISOR",
                color: "amber",
                description: "Authorizes physical warehouse operations. Approves stock adjustments up to ₦1,000,000. Resolves exceptions and overrides allocations. Cannot modify billing or delete logs.",
                permissions: [
                    "company.view",
                    "branches.view",
                    "warehouses.view",
                    "users.view",
                    "roles.view",
                    "inventory.view", "inventory.adjust_request", "inventory.adjust_approve",
                    "receiving.view", "receiving.process",
                    "putaway.view", "putaway.process", "putaway.assign",
                    "picking.view", "picking.process", "picking.assign",
                    "dispatch.view", "dispatch.process", "dispatch.approve",
                    "returns.view", "returns.process", "returns.triage",
                    "reports.view", "reports.export",
                    "audit.view"
                ]
            },
            {
                id: "officer",
                name: "Warehouse Officer",
                badge: "OFFICER",
                color: "emerald",
                description: "Floor execution officer. Can receive goods, scan barcodes, execute put-aways, pick orders, pack and stage dispatches. STRICTLY CANNOT approve adjustments or alter security.",
                permissions: [
                    "company.view",
                    "branches.view",
                    "warehouses.view",
                    "inventory.view", "inventory.adjust_request",
                    "receiving.view", "receiving.process",
                    "putaway.view", "putaway.process",
                    "picking.view", "picking.process",
                    "dispatch.view", "dispatch.pack",
                    "returns.view", "returns.process",
                    "reports.view"
                ]
            },
            {
                id: "manager",
                name: "Operations Manager",
                badge: "OPS MANAGER",
                color: "indigo",
                description: "Cross-branch tactical manager. High-level warehouse analytics, multi-depot inventory visibility, high-value adjustment approval (up to ₦5,000,000).",
                permissions: [
                    "company.view", "company.edit",
                    "branches.view", "branches.edit",
                    "warehouses.view", "warehouses.edit",
                    "users.view",
                    "roles.view",
                    "inventory.view", "inventory.adjust_request", "inventory.adjust_approve",
                    "receiving.view", "receiving.process",
                    "putaway.view", "putaway.process", "putaway.assign",
                    "picking.view", "picking.process",
                    "dispatch.view", "dispatch.process", "dispatch.approve",
                    "returns.view", "returns.process", "returns.triage",
                    "reports.view", "reports.export",
                    "audit.view",
                    "billing.view"
                ]
            },
            {
                id: "finance",
                name: "Finance & Billing Controller",
                badge: "FINANCE",
                color: "sky",
                description: "Responsible for SaaS licensing, multi-client contract storage billing, fee structures, and financial inventory valuation.",
                permissions: [
                    "company.view",
                    "branches.view",
                    "warehouses.view",
                    "inventory.view",
                    "reports.view", "reports.export",
                    "audit.view",
                    "billing.view", "billing.edit"
                ]
            }
        ];

        // Enterprise Users Directory
        const users = [
            {
                id: "USR-001",
                name: "Tunde Adeyemi",
                email: "t.adeyemi@apexlogistics.com",
                roleId: "officer",
                branchId: "BR-LOS",
                warehouseScope: "WH-LOS-01",
                approvalLimit: 0,
                status: "Active",
                avatarText: "TA",
                mfa: true,
                title: "Inbound & Put-Away Floor Officer"
            },
            {
                id: "USR-002",
                name: "Sarah Jenkins",
                email: "s.jenkins@apexlogistics.com",
                roleId: "supervisor",
                branchId: "BR-LOS",
                warehouseScope: "WH-LOS-01",
                approvalLimit: 1000000,
                status: "Active",
                avatarText: "SJ",
                mfa: true,
                title: "Shift Operations Supervisor"
            },
            {
                id: "USR-003",
                name: "Marcus Vance",
                email: "m.vance@apexlogistics.com",
                roleId: "manager",
                branchId: "BR-LOS",
                warehouseScope: "ALL",
                approvalLimit: 5000000,
                status: "Active",
                avatarText: "MV",
                mfa: true,
                title: "Director of Warehouse Operations"
            },
            {
                id: "USR-004",
                name: "Elena Rostova",
                email: "e.rostova@apexlogistics.com",
                roleId: "admin",
                branchId: "BR-LOS",
                warehouseScope: "ALL",
                approvalLimit: 10000000,
                status: "Active",
                avatarText: "ER",
                mfa: true,
                title: "Global Enterprise IT & SecOps Admin"
            },
            {
                id: "USR-005",
                name: "David Sterling",
                email: "d.sterling@apexlogistics.com",
                roleId: "finance",
                branchId: "BR-LOS",
                warehouseScope: "ALL",
                approvalLimit: 2500000,
                status: "Active",
                avatarText: "DS",
                mfa: true,
                title: "Head of SaaS & Contract Accounting"
            },
            {
                id: "USR-006",
                name: "Chinedu Okafor",
                email: "c.okafor@apexlogistics.com",
                roleId: "supervisor",
                branchId: "BR-ABJ",
                warehouseScope: "WH-ABJ-01",
                approvalLimit: 750000,
                status: "Active",
                avatarText: "CO",
                mfa: true,
                title: "Abuja Depot Floor Lead"
            }
        ];

        // Product SKU Catalog
        const products = [
            {
                sku: "SKU-SOLAR-INV-5KW",
                name: "SolarEdge Hybrid Inverter 5KVA",
                category: "Renewable Energy & Power",
                barcode: "789102938401",
                storageRequirement: "Standard",
                targetZone: "Z-AMB",
                weightKg: 24.5,
                costPrice: 420000,
                sellingPrice: 580000,
                minStock: 20,
                maxStock: 200,
                unit: "Units",
                description: "Pure sine-wave 48V solar inverter for residential/commercial installations."
            },
            {
                sku: "SKU-LITH-BAT-48V",
                name: "Pylontech US3000C Lithium Battery 3.5kWh",
                category: "Energy Storage",
                barcode: "789102938402",
                storageRequirement: "Hazardous",
                targetZone: "Z-HAZ",
                weightKg: 32.0,
                costPrice: 650000,
                sellingPrice: 890000,
                minStock: 15,
                maxStock: 150,
                unit: "Units",
                description: "LiFePO4 modular rack-mount storage battery module with smart BMS."
            },
            {
                sku: "SKU-PHARM-VAX-RHO",
                name: "Cold-Chain Pneumococcal Vaccine Lot-X",
                category: "Pharmaceuticals",
                barcode: "789102938403",
                storageRequirement: "Cold",
                targetZone: "Z-COLD",
                weightKg: 0.15,
                costPrice: 28000,
                sellingPrice: 45000,
                minStock: 100,
                maxStock: 1500,
                unit: "Vials",
                description: "Temperature sensitive vaccine requiring strict 2°C to 8°C temperature chain."
            },
            {
                sku: "SKU-IND-CHEM-LUB9",
                name: "Castrol Industrial Heavy Grease 20L",
                category: "Industrial Consumables",
                barcode: "789102938404",
                storageRequirement: "Hazardous",
                targetZone: "Z-HAZ",
                weightKg: 18.2,
                costPrice: 85000,
                sellingPrice: 120000,
                minStock: 25,
                maxStock: 300,
                unit: "Kegs",
                description: "High-temperature marine and rig mechanical lubricant."
            },
            {
                sku: "SKU-FMCG-OLIV-500ML",
                name: "Extra Virgin Olive Oil 500ml (Carton of 12)",
                category: "Food & Beverage",
                barcode: "789102938405",
                storageRequirement: "Standard",
                targetZone: "Z-AMB",
                weightKg: 6.8,
                costPrice: 32000,
                sellingPrice: 48000,
                minStock: 50,
                maxStock: 600,
                unit: "Cartons",
                description: "First cold-pressed Mediterranean culinary olive oil."
            },
            {
                sku: "SKU-TECH-LAP-PRO16",
                name: "Enterprise ProBook 16 i7 32GB 1TB",
                category: "IT Equipment",
                barcode: "789102938406",
                storageRequirement: "Standard",
                targetZone: "Z-AMB",
                weightKg: 2.1,
                costPrice: 780000,
                sellingPrice: 990000,
                minStock: 10,
                maxStock: 80,
                unit: "Pcs",
                description: "Corporate workstation laptops with TPM 2.0 enterprise security chip."
            },
            {
                sku: "SKU-PHARM-INS-10ML",
                name: "Recombinant Human Insulin 100IU/ml",
                category: "Pharmaceuticals",
                barcode: "789102938407",
                storageRequirement: "Cold",
                targetZone: "Z-COLD",
                weightKg: 0.08,
                costPrice: 12500,
                sellingPrice: 19500,
                minStock: 150,
                maxStock: 2000,
                unit: "Vials",
                description: "Cold-chain insulin cartridges for diabetic care programs."
            }
        ];

        // Inventory Balances (SKU per location)
        const inventoryBalances = [
            { id: 1, sku: "SKU-SOLAR-INV-5KW", warehouseId: "WH-LOS-01", locationId: "WH01-AMB-A01-R01-S01-B01", qtyAvailable: 45, qtyReserved: 5, qtyAllocated: 5, qtyDamaged: 0 },
            { id: 2, sku: "SKU-SOLAR-INV-5KW", warehouseId: "WH-LOS-01", locationId: "WH01-AMB-A01-R01-S01-B02", qtyAvailable: 30, qtyReserved: 0, qtyAllocated: 0, qtyDamaged: 0 },
            { id: 3, sku: "SKU-LITH-BAT-48V", warehouseId: "WH-LOS-01", locationId: "WH01-HAZ-A01-R01-S01-B01", qtyAvailable: 28, qtyReserved: 4, qtyAllocated: 4, qtyDamaged: 0 },
            { id: 4, sku: "SKU-PHARM-VAX-RHO", warehouseId: "WH-LOS-01", locationId: "WH01-CLD-A01-R01-S01-B01", qtyAvailable: 340, qtyReserved: 60, qtyAllocated: 60, qtyDamaged: 0 },
            { id: 5, sku: "SKU-PHARM-VAX-RHO", warehouseId: "WH-LOS-01", locationId: "WH01-CLD-A01-R01-S01-B02", qtyAvailable: 210, qtyReserved: 0, qtyAllocated: 0, qtyDamaged: 5 },
            { id: 6, sku: "SKU-IND-CHEM-LUB9", warehouseId: "WH-LOS-01", locationId: "WH01-HAZ-A01-R02-S01-B01", qtyAvailable: 52, qtyReserved: 10, qtyAllocated: 10, qtyDamaged: 0 },
            { id: 7, sku: "SKU-FMCG-OLIV-500ML", warehouseId: "WH-LOS-01", locationId: "WH01-AMB-A02-R01-S01-B01", qtyAvailable: 180, qtyReserved: 25, qtyAllocated: 25, qtyDamaged: 2 },
            { id: 8, sku: "SKU-TECH-LAP-PRO16", warehouseId: "WH-LOS-01", locationId: "WH01-AMB-A03-R01-S01-B01", qtyAvailable: 22, qtyReserved: 6, qtyAllocated: 6, qtyDamaged: 0 },
            { id: 9, sku: "SKU-PHARM-INS-10ML", warehouseId: "WH-LOS-01", locationId: "WH01-CLD-A02-R01-S01-B01", qtyAvailable: 480, qtyReserved: 40, qtyAllocated: 40, qtyDamaged: 0 }
        ];

        // Inbound Purchase Orders
        const purchaseOrders = [
            {
                id: "PO-2026-0891",
                supplierName: "Shenzhen CleanTech Power Co.",
                warehouseId: "WH-LOS-01",
                status: "Receiving",
                etaDate: "2026-09-06",
                createdDate: "2026-09-01",
                items: [
                    { sku: "SKU-SOLAR-INV-5KW", expectedQty: 40, receivedQty: 25, damagedQty: 0, unitCost: 420000 },
                    { sku: "SKU-LITH-BAT-48V", expectedQty: 30, receivedQty: 10, damagedQty: 1, unitCost: 650000 }
                ]
            },
            {
                id: "PO-2026-0892",
                supplierName: "BioPharma Nordic AB",
                warehouseId: "WH-LOS-01",
                status: "Expected",
                etaDate: "2026-09-07",
                createdDate: "2026-09-03",
                items: [
                    { sku: "SKU-PHARM-VAX-RHO", expectedQty: 500, receivedQty: 0, damagedQty: 0, unitCost: 28000 },
                    { sku: "SKU-PHARM-INS-10ML", expectedQty: 600, receivedQty: 0, damagedQty: 0, unitCost: 12500 }
                ]
            },
            {
                id: "PO-2026-0888",
                supplierName: "Dell EMC West Africa Distribution",
                warehouseId: "WH-LOS-01",
                status: "Completed",
                etaDate: "2026-09-04",
                createdDate: "2026-08-28",
                items: [
                    { sku: "SKU-TECH-LAP-PRO16", expectedQty: 30, receivedQty: 30, damagedQty: 0, unitCost: 780000 }
                ]
            }
        ];

        // Put-away Tasks
        const putawayTasks = [
            {
                id: "PUT-00104",
                poId: "PO-2026-0891",
                sku: "SKU-SOLAR-INV-5KW",
                qty: 25,
                sourceLocationId: "WH01-STG-INBOUND-01",
                recommendedLocationId: "WH01-AMB-A01-R01-S01-B02",
                assignedUserId: "USR-001",
                assignedUserName: "Tunde Adeyemi",
                status: "Pending",
                priority: "High",
                createdAt: "2026-09-06T10:15:00Z"
            },
            {
                id: "PUT-00105",
                poId: "PO-2026-0891",
                sku: "SKU-LITH-BAT-48V",
                qty: 10,
                sourceLocationId: "WH01-STG-INBOUND-01",
                recommendedLocationId: "WH01-HAZ-A01-R01-S01-B01",
                assignedUserId: "USR-001",
                assignedUserName: "Tunde Adeyemi",
                status: "Pending",
                priority: "Urgent",
                createdAt: "2026-09-06T10:20:00Z"
            }
        ];

        // Outbound Orders
        const orders = [
            {
                id: "ORD-NG-2026-771",
                customerName: "GreenVolt Solar Solutions Ltd.",
                destination: "Plot 19 Lekki Phase 1, Lagos",
                warehouseId: "WH-LOS-01",
                status: "Allocated",
                priority: "Urgent",
                courier: "GIG Logistics",
                trackingNumber: "GIG-LG-99201",
                createdAt: "2026-09-06T09:30:00Z",
                items: [
                    { sku: "SKU-SOLAR-INV-5KW", qty: 5, pickedQty: 0, packedQty: 0, locationId: "WH01-AMB-A01-R01-S01-B01" },
                    { sku: "SKU-LITH-BAT-48V", qty: 4, pickedQty: 0, packedQty: 0, locationId: "WH01-HAZ-A01-R01-S01-B01" }
                ]
            },
            {
                id: "ORD-NG-2026-772",
                customerName: "Federal Ministry of Health Clinic",
                destination: "Garki Hospital Stores, Abuja FCT",
                warehouseId: "WH-LOS-01",
                status: "Picking",
                priority: "Urgent",
                courier: "DHL Express Cold-Chain",
                trackingNumber: "DHL-CC-448102",
                createdAt: "2026-09-06T08:00:00Z",
                items: [
                    { sku: "SKU-PHARM-VAX-RHO", qty: 60, pickedQty: 60, packedQty: 0, locationId: "WH01-CLD-A01-R01-S01-B01" },
                    { sku: "SKU-PHARM-INS-10ML", qty: 40, pickedQty: 20, packedQty: 0, locationId: "WH01-CLD-A02-R01-S01-B01" }
                ]
            },
            {
                id: "ORD-NG-2026-770",
                customerName: "TotalEnergies Port Harcourt Hub",
                destination: "Trans-Amadi Yard 4, Port Harcourt",
                warehouseId: "WH-LOS-01",
                status: "Packed",
                priority: "Normal",
                courier: "FedEx Freight",
                trackingNumber: "FDX-NG-33019",
                createdAt: "2026-09-05T14:00:00Z",
                items: [
                    { sku: "SKU-IND-CHEM-LUB9", qty: 10, pickedQty: 10, packedQty: 10, locationId: "WH01-HAZ-A01-R02-S01-B01" }
                ]
            },
            {
                id: "ORD-NG-2026-768",
                customerName: "Konga E-Commerce Mega-Store",
                destination: "Oregun Logistics Depot, Ikeja",
                warehouseId: "WH-LOS-01",
                status: "Dispatched",
                priority: "Normal",
                courier: "Apex Internal Fleet Van 04",
                trackingNumber: "APX-FL-1004",
                createdAt: "2026-09-05T11:00:00Z",
                dispatchedAt: "2026-09-05T16:30:00Z",
                items: [
                    { sku: "SKU-FMCG-OLIV-500ML", qty: 25, pickedQty: 25, packedQty: 25, locationId: "WH01-AMB-A02-R01-S01-B01" },
                    { sku: "SKU-TECH-LAP-PRO16", qty: 6, pickedQty: 6, packedQty: 6, locationId: "WH01-AMB-A03-R01-S01-B01" }
                ]
            }
        ];

        // Picking Tasks
        const pickingTasks = [
            {
                id: "PCK-8801",
                orderId: "ORD-NG-2026-771",
                sku: "SKU-SOLAR-INV-5KW",
                locationId: "WH01-AMB-A01-R01-S01-B01",
                qty: 5,
                pickedQty: 0,
                assignedUserId: "USR-001",
                status: "Assigned"
            },
            {
                id: "PCK-8802",
                orderId: "ORD-NG-2026-771",
                sku: "SKU-LITH-BAT-48V",
                locationId: "WH01-HAZ-A01-R01-S01-B01",
                qty: 4,
                pickedQty: 0,
                assignedUserId: "USR-001",
                status: "Assigned"
            },
            {
                id: "PCK-8800",
                orderId: "ORD-NG-2026-772",
                sku: "SKU-PHARM-VAX-RHO",
                locationId: "WH01-CLD-A01-R01-S01-B01",
                qty: 60,
                pickedQty: 60,
                assignedUserId: "USR-001",
                status: "Completed"
            }
        ];

        // Stock Adjustments (Strict SoD Demonstrator)
        const adjustments = [
            {
                id: "ADJ-2026-0041",
                sku: "SKU-FMCG-OLIV-500ML",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A02-R01-S01-B01",
                prevQty: 182,
                targetQty: 180,
                variance: -2,
                costVariance: -64000,
                requestedByUserId: "USR-001",
                requestedByName: "Tunde Adeyemi (Warehouse Officer)",
                approvedByUserId: "USR-002",
                approvedByName: "Sarah Jenkins (Supervisor)",
                reasonCode: "Physical count discrepancy",
                evidenceNotes: "Physical count during morning audit revealed 2 broken bottles inside carton.",
                status: "Approved",
                createdAt: "2026-09-05T09:00:00Z",
                approvedAt: "2026-09-05T10:15:00Z"
            },
            {
                id: "ADJ-2026-0042",
                sku: "SKU-SOLAR-INV-5KW",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A01-R01-S01-B02",
                prevQty: 31,
                targetQty: 30,
                variance: -1,
                costVariance: -420000,
                requestedByUserId: "USR-001",
                requestedByName: "Tunde Adeyemi (Warehouse Officer)",
                approvedByUserId: null,
                approvedByName: null,
                reasonCode: "Data entry correction",
                evidenceNotes: "One unit misplaced in transit aisle found scratched and quarantined.",
                status: "Pending",
                createdAt: "2026-09-06T11:00:00Z",
                approvedAt: null
            },
            {
                id: "ADJ-2026-0043",
                sku: "SKU-TECH-LAP-PRO16",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A03-R01-S01-B01",
                prevQty: 24,
                targetQty: 22,
                variance: -2,
                costVariance: -1560000, // ₦1.56M (Exceeds Sarah's ₦1M limit, needs Manager Marcus!)
                requestedByUserId: "USR-001",
                requestedByName: "Tunde Adeyemi (Warehouse Officer)",
                approvedByUserId: null,
                approvedByName: null,
                reasonCode: "Damaged goods discovered",
                evidenceNotes: "Severe water leak near roof rack damaged packaging beyond commercial acceptance.",
                status: "Pending",
                createdAt: "2026-09-06T12:30:00Z",
                approvedAt: null
            }
        ];

        // Returns (Reverse Logistics)
        const returns = [
            {
                id: "RMA-2026-012",
                orderId: "ORD-NG-2026-768",
                sku: "SKU-FMCG-OLIV-500ML",
                qty: 2,
                customerName: "Konga Retail Stores",
                reasonCode: "Customer Damaged Packaging",
                triageDisposition: "Quarantined",
                inspectedByUserId: "USR-002",
                inspectedByName: "Sarah Jenkins",
                routedZoneId: "Z-QUAR",
                targetLocationId: "WH01-QUR-A01-R01-S01-B01",
                status: "Processed",
                createdAt: "2026-09-06T09:00:00Z"
            }
        ];

        // Physical Transaction Ledger
        const inventoryLedger = [
            {
                entryId: 1001,
                txUuid: "8a32d1-e701-419b-810a-01c7793",
                sku: "SKU-SOLAR-INV-5KW",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A01-R01-S01-B01",
                prevQty: 0,
                changeQty: 50,
                newQty: 50,
                transactionType: "Receiving",
                userId: "USR-001",
                userName: "Tunde Adeyemi",
                timestamp: "2026-08-28T10:00:00Z",
                refDocId: "PO-2026-0870"
            },
            {
                entryId: 1002,
                txUuid: "9f42c2-d612-429a-921b-02d8804",
                sku: "SKU-SOLAR-INV-5KW",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A01-R01-S01-B01",
                prevQty: 50,
                changeQty: -5,
                newQty: 45,
                transactionType: "Pick",
                userId: "USR-001",
                userName: "Tunde Adeyemi",
                timestamp: "2026-09-02T14:30:00Z",
                refDocId: "ORD-NG-2026-750"
            },
            {
                entryId: 1003,
                txUuid: "a123e4-b819-438c-811c-03e9915",
                sku: "SKU-FMCG-OLIV-500ML",
                warehouseId: "WH-LOS-01",
                locationId: "WH01-AMB-A02-R01-S01-B01",
                prevQty: 182,
                changeQty: -2,
                newQty: 180,
                transactionType: "Adjustment",
                userId: "USR-002",
                userName: "Sarah Jenkins (Approved)",
                timestamp: "2026-09-05T10:15:00Z",
                refDocId: "ADJ-2026-0041"
            }
        ];

        // Immutable Cryptographic Audit Trail
        const auditTrail = [];

        function appendAudit(prevHash, time, user, role, severity, action, message, stateSnapshot) {
            const rawBlock = `${prevHash}|${time}|${user}|${role}|${severity}|${action}|${message}|${JSON.stringify(stateSnapshot || {})}`;
            const blockHash = sha256(rawBlock);
            return {
                id: auditTrail.length + 1,
                timestamp: time,
                userId: user,
                role: role,
                severity: severity,
                actionType: action,
                message: message,
                prevHash: prevHash,
                hash: blockHash,
                ipAddress: "197.210.226.42 (Lagos Enterprise Gateway)",
                deviceUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Enterprise Handheld Terminal"
            };
        }

        let curHash = genesisHash;

        const auditEvents = [
            { t: "2026-08-30T08:00:00Z", u: "USR-004", r: "admin", s: "info", a: "SYSTEM_INIT", m: "Enterprise WOS System initialized. Zero-Trust RBAC & Ledger security policies active." },
            { t: "2026-08-30T08:15:00Z", u: "USR-004", r: "admin", s: "info", a: "USER_INVITED", m: "Invited Tunde Adeyemi with role 'officer' scoped to WH-LOS-01." },
            { t: "2026-08-30T08:16:00Z", u: "USR-004", r: "admin", s: "info", a: "USER_INVITED", m: "Invited Sarah Jenkins with role 'supervisor' (approval limit ₦1,000,000)." },
            { t: "2026-09-01T09:30:00Z", u: "USR-001", r: "officer", s: "info", a: "PO_RECEIVING_START", m: "Started receiving goods against Inbound PO-2026-0891 at Inbound Staging Bay." },
            { t: "2026-09-01T10:05:00Z", u: "USR-001", r: "officer", s: "warning", a: "SOD_VIOLATION_BLOCKED", m: "Warehouse Officer attempted to approve Stock Adjustment without authorization. Request intercepted & denied by RBAC policy guardrail." },
            { t: "2026-09-05T09:00:00Z", u: "USR-001", r: "officer", s: "info", a: "ADJUSTMENT_REQUESTED", m: "Raised Stock Adjustment ADJ-2026-0041 for SKU-FMCG-OLIV-500ML (variance: -2 units, ₦-64,000)." },
            { t: "2026-09-05T10:15:00Z", u: "USR-002", r: "supervisor", s: "success", a: "ADJUSTMENT_APPROVED", m: "Approved Stock Adjustment ADJ-2026-0041 within delegated financial threshold. Inventory ledger committed." },
            { t: "2026-09-05T16:30:00Z", u: "USR-002", r: "supervisor", s: "success", a: "ORDER_DISPATCHED", m: "Authorized Outbound Dispatch ORD-NG-2026-768 via Fleet Van 04. Gate Pass generated." },
            { t: "2026-09-06T11:00:00Z", u: "USR-001", r: "officer", s: "info", a: "ADJUSTMENT_REQUESTED", m: "Raised Stock Adjustment ADJ-2026-0042 for SKU-SOLAR-INV-5KW (variance: -1 unit, ₦-420,000)." }
        ];

        auditEvents.forEach(evt => {
            const entry = appendAudit(curHash, evt.t, evt.u, evt.r, evt.s, evt.a, evt.m);
            curHash = entry.hash;
            auditTrail.push(entry);
        });

        const saasSubscription = {
            planName: "Enterprise Tier",
            status: "Active",
            monthlyBaseCost: 249,
            costPerWarehouse: 49,
            costPerUser: 15,
            activeWarehouses: warehouses.length,
            activeUsers: users.length,
            currency: "USD",
            billingInterval: "Monthly",
            currentBillingCycle: "Sep 01, 2026 – Sep 30, 2026",
            paymentMethod: "Mastercard Enterprise Corporate ending in •••• 9104",
            nextInvoiceAmount: 249 + (warehouses.length * 49) + (users.length * 15)
        };

        return {
            company,
            branches,
            warehouses,
            zones,
            locations,
            roles,
            users,
            products,
            inventoryBalances,
            purchaseOrders,
            putawayTasks,
            orders,
            pickingTasks,
            adjustments,
            returns,
            inventoryLedger,
            auditTrail,
            saasSubscription,
            activeUser: users[0], // Default active persona: Tunde Adeyemi (Warehouse Officer)
            activeWarehouseId: "WH-LOS-01"
        };
    }

    let state = null;

    function init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                state = JSON.parse(saved);
            } else {
                state = generateSeedState();
                persist();
            }
        } catch (e) {
            console.warn("WOS Data Init error, resetting to seed state:", e);
            state = generateSeedState();
            persist();
        }
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to persist WOS state to localStorage:", e);
        }
    }

    function resetToFactorySeed() {
        state = generateSeedState();
        persist();
        return state;
    }

    function getState() {
        if (!state) init();
        return state;
    }

    function recordAudit(userId, role, severity, actionType, message, details) {
        if (!state) init();
        const lastEntry = state.auditTrail[state.auditTrail.length - 1];
        const prevHash = lastEntry ? lastEntry.hash : sha256("GENESIS_BLOCK_WOS");
        const timestamp = new Date().toISOString();
        const rawPayload = `${prevHash}|${timestamp}|${userId}|${role}|${severity}|${actionType}|${message}|${JSON.stringify(details || {})}`;
        const blockHash = sha256(rawPayload);

        const newLog = {
            id: state.auditTrail.length + 1,
            timestamp: timestamp,
            userId: userId,
            role: role,
            severity: severity,
            actionType: actionType,
            message: message,
            details: details || null,
            prevHash: prevHash,
            hash: blockHash,
            ipAddress: "197.210.226.42 (Active Session)",
            deviceUserAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : "WOS Enterprise Client"
        };

        state.auditTrail.push(newLog);
        persist();

        // Asynchronously replicate audit log block to Supabase cloud
        if (typeof WOS_Supabase !== 'undefined' && WOS_Supabase.recordAuditAsync) {
            WOS_Supabase.recordAuditAsync(newLog);
        }

        return newLog;
    }

    function verifyAuditIntegrity() {
        if (!state) init();
        const logs = state.auditTrail;
        if (!logs || logs.length === 0) return { valid: true, count: 0 };

        for (let i = 1; i < logs.length; i++) {
            const prev = logs[i - 1];
            const curr = logs[i];

            if (curr.prevHash !== prev.hash) {
                return {
                    valid: false,
                    tamperedIndex: i,
                    tamperedLogId: curr.id,
                    expectedPrevHash: prev.hash,
                    actualPrevHash: curr.prevHash,
                    reason: `Cryptographic link severed at record #${curr.id}. Hash chaining does not match previous block.`
                };
            }

            const rawPayload = `${curr.prevHash}|${curr.timestamp}|${curr.userId}|${curr.role}|${curr.severity}|${curr.actionType}|${curr.message}|${JSON.stringify(curr.details || {})}`;
            const computedHash = sha256(rawPayload);
            if (computedHash !== curr.hash) {
                return {
                    valid: false,
                    tamperedIndex: i,
                    tamperedLogId: curr.id,
                    reason: `Record #${curr.id} content was modified after signing! Signature mismatch.`
                };
            }
        }

        return {
            valid: true,
            count: logs.length,
            genesisHash: logs[0].prevHash,
            latestHash: logs[logs.length - 1].hash
        };
    }

    function recordStockMovement(sku, warehouseId, locationId, prevQty, changeQty, transactionType, userId, userName, refDocId) {
        if (!state) init();
        const newQty = prevQty + changeQty;
        const entry = {
            entryId: state.inventoryLedger.length + 1001,
            txUuid: 'tx-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
            sku,
            warehouseId,
            locationId,
            prevQty,
            changeQty,
            newQty,
            transactionType,
            userId,
            userName,
            timestamp: new Date().toISOString(),
            refDocId
        };
        state.inventoryLedger.unshift(entry);
        persist();
        return entry;
    }

    init();

    return {
        getState,
        persist,
        resetToFactorySeed,
        recordAudit,
        verifyAuditIntegrity,
        recordStockMovement,
        sha256
    };
})();

if (typeof window !== 'undefined') {
    window.WOS_Data = WOS_Data;
}
