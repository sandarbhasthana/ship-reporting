"use strict";
/**
 * Prisma 7 - Shared database package
 *
 * Re-exports the generated Prisma client and provides a singleton instance.
 * Import from '@ship-reporting/prisma' in your apps.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.$Enums = exports.InspectionStatus = exports.RoleName = exports.Prisma = exports.PrismaClient = void 0;
// Re-export everything from the generated Prisma client
// Prisma 7 uses client.ts as the main entry point
var client_1 = require("../generated/client/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_1.Prisma; } });
Object.defineProperty(exports, "RoleName", { enumerable: true, get: function () { return client_1.RoleName; } });
Object.defineProperty(exports, "InspectionStatus", { enumerable: true, get: function () { return client_1.InspectionStatus; } });
Object.defineProperty(exports, "$Enums", { enumerable: true, get: function () { return client_1.$Enums; } });
//# sourceMappingURL=index.js.map