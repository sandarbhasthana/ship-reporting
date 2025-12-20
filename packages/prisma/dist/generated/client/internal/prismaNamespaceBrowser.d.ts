import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly Organization: "Organization";
    readonly User: "User";
    readonly Vessel: "Vessel";
    readonly InspectionReport: "InspectionReport";
    readonly InspectionEntry: "InspectionEntry";
    readonly AuditLog: "AuditLog";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const OrganizationScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly phone: "phone";
    readonly owner: "owner";
    readonly logo: "logo";
    readonly defaultFormNo: "defaultFormNo";
    readonly footerText: "footerText";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type OrganizationScalarFieldEnum = (typeof OrganizationScalarFieldEnum)[keyof typeof OrganizationScalarFieldEnum];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly passwordHash: "passwordHash";
    readonly name: "name";
    readonly isActive: "isActive";
    readonly signatureImage: "signatureImage";
    readonly profileImage: "profileImage";
    readonly role: "role";
    readonly organizationId: "organizationId";
    readonly assignedVesselId: "assignedVesselId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const VesselScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly imoNumber: "imoNumber";
    readonly callSign: "callSign";
    readonly flag: "flag";
    readonly organizationId: "organizationId";
    readonly shipFileNo: "shipFileNo";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type VesselScalarFieldEnum = (typeof VesselScalarFieldEnum)[keyof typeof VesselScalarFieldEnum];
export declare const InspectionReportScalarFieldEnum: {
    readonly id: "id";
    readonly organizationId: "organizationId";
    readonly vesselId: "vesselId";
    readonly title: "title";
    readonly shipFileNo: "shipFileNo";
    readonly officeFileNo: "officeFileNo";
    readonly revisionNo: "revisionNo";
    readonly formNo: "formNo";
    readonly applicableFomSections: "applicableFomSections";
    readonly inspectedBy: "inspectedBy";
    readonly inspectionDate: "inspectionDate";
    readonly createdById: "createdById";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type InspectionReportScalarFieldEnum = (typeof InspectionReportScalarFieldEnum)[keyof typeof InspectionReportScalarFieldEnum];
export declare const InspectionEntryScalarFieldEnum: {
    readonly id: "id";
    readonly reportId: "reportId";
    readonly srNo: "srNo";
    readonly deficiency: "deficiency";
    readonly mastersCauseAnalysis: "mastersCauseAnalysis";
    readonly correctiveAction: "correctiveAction";
    readonly preventiveAction: "preventiveAction";
    readonly completionDate: "completionDate";
    readonly companyAnalysis: "companyAnalysis";
    readonly status: "status";
    readonly officeSignUserId: "officeSignUserId";
    readonly officeSignDate: "officeSignDate";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type InspectionEntryScalarFieldEnum = (typeof InspectionEntryScalarFieldEnum)[keyof typeof InspectionEntryScalarFieldEnum];
export declare const AuditLogScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly organizationId: "organizationId";
    readonly entityType: "entityType";
    readonly entityId: "entityId";
    readonly action: "action";
    readonly before: "before";
    readonly after: "after";
    readonly ip: "ip";
    readonly userAgent: "userAgent";
    readonly requestId: "requestId";
    readonly createdAt: "createdAt";
};
export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: "DbNull";
    readonly JsonNull: "JsonNull";
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: "DbNull";
    readonly JsonNull: "JsonNull";
    readonly AnyNull: "AnyNull";
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map