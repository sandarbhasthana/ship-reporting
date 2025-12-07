import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model Vessel
 *
 */
export type VesselModel = runtime.Types.Result.DefaultSelection<Prisma.$VesselPayload>;
export type AggregateVessel = {
    _count: VesselCountAggregateOutputType | null;
    _min: VesselMinAggregateOutputType | null;
    _max: VesselMaxAggregateOutputType | null;
};
export type VesselMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    imoNumber: string | null;
    callSign: string | null;
    flag: string | null;
    organizationId: string | null;
    shipFileNo: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type VesselMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    imoNumber: string | null;
    callSign: string | null;
    flag: string | null;
    organizationId: string | null;
    shipFileNo: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type VesselCountAggregateOutputType = {
    id: number;
    name: number;
    imoNumber: number;
    callSign: number;
    flag: number;
    organizationId: number;
    shipFileNo: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type VesselMinAggregateInputType = {
    id?: true;
    name?: true;
    imoNumber?: true;
    callSign?: true;
    flag?: true;
    organizationId?: true;
    shipFileNo?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type VesselMaxAggregateInputType = {
    id?: true;
    name?: true;
    imoNumber?: true;
    callSign?: true;
    flag?: true;
    organizationId?: true;
    shipFileNo?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type VesselCountAggregateInputType = {
    id?: true;
    name?: true;
    imoNumber?: true;
    callSign?: true;
    flag?: true;
    organizationId?: true;
    shipFileNo?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type VesselAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Vessel to aggregate.
     */
    where?: Prisma.VesselWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Vessels to fetch.
     */
    orderBy?: Prisma.VesselOrderByWithRelationInput | Prisma.VesselOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.VesselWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Vessels from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Vessels.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Vessels
    **/
    _count?: true | VesselCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: VesselMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: VesselMaxAggregateInputType;
};
export type GetVesselAggregateType<T extends VesselAggregateArgs> = {
    [P in keyof T & keyof AggregateVessel]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateVessel[P]> : Prisma.GetScalarType<T[P], AggregateVessel[P]>;
};
export type VesselGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.VesselWhereInput;
    orderBy?: Prisma.VesselOrderByWithAggregationInput | Prisma.VesselOrderByWithAggregationInput[];
    by: Prisma.VesselScalarFieldEnum[] | Prisma.VesselScalarFieldEnum;
    having?: Prisma.VesselScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: VesselCountAggregateInputType | true;
    _min?: VesselMinAggregateInputType;
    _max?: VesselMaxAggregateInputType;
};
export type VesselGroupByOutputType = {
    id: string;
    name: string;
    imoNumber: string | null;
    callSign: string | null;
    flag: string | null;
    organizationId: string | null;
    shipFileNo: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: VesselCountAggregateOutputType | null;
    _min: VesselMinAggregateOutputType | null;
    _max: VesselMaxAggregateOutputType | null;
};
type GetVesselGroupByPayload<T extends VesselGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<VesselGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof VesselGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], VesselGroupByOutputType[P]> : Prisma.GetScalarType<T[P], VesselGroupByOutputType[P]>;
}>>;
export type VesselWhereInput = {
    AND?: Prisma.VesselWhereInput | Prisma.VesselWhereInput[];
    OR?: Prisma.VesselWhereInput[];
    NOT?: Prisma.VesselWhereInput | Prisma.VesselWhereInput[];
    id?: Prisma.StringFilter<"Vessel"> | string;
    name?: Prisma.StringFilter<"Vessel"> | string;
    imoNumber?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    callSign?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    flag?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    organizationId?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    shipFileNo?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationNullableScalarRelationFilter, Prisma.OrganizationWhereInput> | null;
    captain?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    inspections?: Prisma.InspectionReportListRelationFilter;
};
export type VesselOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    imoNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    callSign?: Prisma.SortOrderInput | Prisma.SortOrder;
    flag?: Prisma.SortOrderInput | Prisma.SortOrder;
    organizationId?: Prisma.SortOrderInput | Prisma.SortOrder;
    shipFileNo?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    organization?: Prisma.OrganizationOrderByWithRelationInput;
    captain?: Prisma.UserOrderByWithRelationInput;
    inspections?: Prisma.InspectionReportOrderByRelationAggregateInput;
};
export type VesselWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    imoNumber?: string;
    AND?: Prisma.VesselWhereInput | Prisma.VesselWhereInput[];
    OR?: Prisma.VesselWhereInput[];
    NOT?: Prisma.VesselWhereInput | Prisma.VesselWhereInput[];
    name?: Prisma.StringFilter<"Vessel"> | string;
    callSign?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    flag?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    organizationId?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    shipFileNo?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationNullableScalarRelationFilter, Prisma.OrganizationWhereInput> | null;
    captain?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    inspections?: Prisma.InspectionReportListRelationFilter;
}, "id" | "imoNumber">;
export type VesselOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    imoNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    callSign?: Prisma.SortOrderInput | Prisma.SortOrder;
    flag?: Prisma.SortOrderInput | Prisma.SortOrder;
    organizationId?: Prisma.SortOrderInput | Prisma.SortOrder;
    shipFileNo?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.VesselCountOrderByAggregateInput;
    _max?: Prisma.VesselMaxOrderByAggregateInput;
    _min?: Prisma.VesselMinOrderByAggregateInput;
};
export type VesselScalarWhereWithAggregatesInput = {
    AND?: Prisma.VesselScalarWhereWithAggregatesInput | Prisma.VesselScalarWhereWithAggregatesInput[];
    OR?: Prisma.VesselScalarWhereWithAggregatesInput[];
    NOT?: Prisma.VesselScalarWhereWithAggregatesInput | Prisma.VesselScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Vessel"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Vessel"> | string;
    imoNumber?: Prisma.StringNullableWithAggregatesFilter<"Vessel"> | string | null;
    callSign?: Prisma.StringNullableWithAggregatesFilter<"Vessel"> | string | null;
    flag?: Prisma.StringNullableWithAggregatesFilter<"Vessel"> | string | null;
    organizationId?: Prisma.StringNullableWithAggregatesFilter<"Vessel"> | string | null;
    shipFileNo?: Prisma.StringNullableWithAggregatesFilter<"Vessel"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Vessel"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Vessel"> | Date | string;
};
export type VesselCreateInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    organization?: Prisma.OrganizationCreateNestedOneWithoutVesselsInput;
    captain?: Prisma.UserCreateNestedOneWithoutAssignedVesselInput;
    inspections?: Prisma.InspectionReportCreateNestedManyWithoutVesselInput;
};
export type VesselUncheckedCreateInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    organizationId?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    captain?: Prisma.UserUncheckedCreateNestedOneWithoutAssignedVesselInput;
    inspections?: Prisma.InspectionReportUncheckedCreateNestedManyWithoutVesselInput;
};
export type VesselUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneWithoutVesselsNestedInput;
    captain?: Prisma.UserUpdateOneWithoutAssignedVesselNestedInput;
    inspections?: Prisma.InspectionReportUpdateManyWithoutVesselNestedInput;
};
export type VesselUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    organizationId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    captain?: Prisma.UserUncheckedUpdateOneWithoutAssignedVesselNestedInput;
    inspections?: Prisma.InspectionReportUncheckedUpdateManyWithoutVesselNestedInput;
};
export type VesselCreateManyInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    organizationId?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type VesselUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VesselUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    organizationId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VesselListRelationFilter = {
    every?: Prisma.VesselWhereInput;
    some?: Prisma.VesselWhereInput;
    none?: Prisma.VesselWhereInput;
};
export type VesselOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type VesselNullableScalarRelationFilter = {
    is?: Prisma.VesselWhereInput | null;
    isNot?: Prisma.VesselWhereInput | null;
};
export type VesselCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    imoNumber?: Prisma.SortOrder;
    callSign?: Prisma.SortOrder;
    flag?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    shipFileNo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type VesselMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    imoNumber?: Prisma.SortOrder;
    callSign?: Prisma.SortOrder;
    flag?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    shipFileNo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type VesselMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    imoNumber?: Prisma.SortOrder;
    callSign?: Prisma.SortOrder;
    flag?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    shipFileNo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type VesselScalarRelationFilter = {
    is?: Prisma.VesselWhereInput;
    isNot?: Prisma.VesselWhereInput;
};
export type VesselCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput> | Prisma.VesselCreateWithoutOrganizationInput[] | Prisma.VesselUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutOrganizationInput | Prisma.VesselCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.VesselCreateManyOrganizationInputEnvelope;
    connect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
};
export type VesselUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput> | Prisma.VesselCreateWithoutOrganizationInput[] | Prisma.VesselUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutOrganizationInput | Prisma.VesselCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.VesselCreateManyOrganizationInputEnvelope;
    connect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
};
export type VesselUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput> | Prisma.VesselCreateWithoutOrganizationInput[] | Prisma.VesselUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutOrganizationInput | Prisma.VesselCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.VesselUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.VesselUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.VesselCreateManyOrganizationInputEnvelope;
    set?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    disconnect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    delete?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    connect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    update?: Prisma.VesselUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.VesselUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.VesselUpdateManyWithWhereWithoutOrganizationInput | Prisma.VesselUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.VesselScalarWhereInput | Prisma.VesselScalarWhereInput[];
};
export type VesselUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput> | Prisma.VesselCreateWithoutOrganizationInput[] | Prisma.VesselUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutOrganizationInput | Prisma.VesselCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.VesselUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.VesselUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.VesselCreateManyOrganizationInputEnvelope;
    set?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    disconnect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    delete?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    connect?: Prisma.VesselWhereUniqueInput | Prisma.VesselWhereUniqueInput[];
    update?: Prisma.VesselUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.VesselUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.VesselUpdateManyWithWhereWithoutOrganizationInput | Prisma.VesselUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.VesselScalarWhereInput | Prisma.VesselScalarWhereInput[];
};
export type VesselCreateNestedOneWithoutCaptainInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutCaptainInput, Prisma.VesselUncheckedCreateWithoutCaptainInput>;
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutCaptainInput;
    connect?: Prisma.VesselWhereUniqueInput;
};
export type VesselUpdateOneWithoutCaptainNestedInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutCaptainInput, Prisma.VesselUncheckedCreateWithoutCaptainInput>;
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutCaptainInput;
    upsert?: Prisma.VesselUpsertWithoutCaptainInput;
    disconnect?: Prisma.VesselWhereInput | boolean;
    delete?: Prisma.VesselWhereInput | boolean;
    connect?: Prisma.VesselWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.VesselUpdateToOneWithWhereWithoutCaptainInput, Prisma.VesselUpdateWithoutCaptainInput>, Prisma.VesselUncheckedUpdateWithoutCaptainInput>;
};
export type VesselCreateNestedOneWithoutInspectionsInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutInspectionsInput, Prisma.VesselUncheckedCreateWithoutInspectionsInput>;
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutInspectionsInput;
    connect?: Prisma.VesselWhereUniqueInput;
};
export type VesselUpdateOneRequiredWithoutInspectionsNestedInput = {
    create?: Prisma.XOR<Prisma.VesselCreateWithoutInspectionsInput, Prisma.VesselUncheckedCreateWithoutInspectionsInput>;
    connectOrCreate?: Prisma.VesselCreateOrConnectWithoutInspectionsInput;
    upsert?: Prisma.VesselUpsertWithoutInspectionsInput;
    connect?: Prisma.VesselWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.VesselUpdateToOneWithWhereWithoutInspectionsInput, Prisma.VesselUpdateWithoutInspectionsInput>, Prisma.VesselUncheckedUpdateWithoutInspectionsInput>;
};
export type VesselCreateWithoutOrganizationInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    captain?: Prisma.UserCreateNestedOneWithoutAssignedVesselInput;
    inspections?: Prisma.InspectionReportCreateNestedManyWithoutVesselInput;
};
export type VesselUncheckedCreateWithoutOrganizationInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    captain?: Prisma.UserUncheckedCreateNestedOneWithoutAssignedVesselInput;
    inspections?: Prisma.InspectionReportUncheckedCreateNestedManyWithoutVesselInput;
};
export type VesselCreateOrConnectWithoutOrganizationInput = {
    where: Prisma.VesselWhereUniqueInput;
    create: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput>;
};
export type VesselCreateManyOrganizationInputEnvelope = {
    data: Prisma.VesselCreateManyOrganizationInput | Prisma.VesselCreateManyOrganizationInput[];
    skipDuplicates?: boolean;
};
export type VesselUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.VesselWhereUniqueInput;
    update: Prisma.XOR<Prisma.VesselUpdateWithoutOrganizationInput, Prisma.VesselUncheckedUpdateWithoutOrganizationInput>;
    create: Prisma.XOR<Prisma.VesselCreateWithoutOrganizationInput, Prisma.VesselUncheckedCreateWithoutOrganizationInput>;
};
export type VesselUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.VesselWhereUniqueInput;
    data: Prisma.XOR<Prisma.VesselUpdateWithoutOrganizationInput, Prisma.VesselUncheckedUpdateWithoutOrganizationInput>;
};
export type VesselUpdateManyWithWhereWithoutOrganizationInput = {
    where: Prisma.VesselScalarWhereInput;
    data: Prisma.XOR<Prisma.VesselUpdateManyMutationInput, Prisma.VesselUncheckedUpdateManyWithoutOrganizationInput>;
};
export type VesselScalarWhereInput = {
    AND?: Prisma.VesselScalarWhereInput | Prisma.VesselScalarWhereInput[];
    OR?: Prisma.VesselScalarWhereInput[];
    NOT?: Prisma.VesselScalarWhereInput | Prisma.VesselScalarWhereInput[];
    id?: Prisma.StringFilter<"Vessel"> | string;
    name?: Prisma.StringFilter<"Vessel"> | string;
    imoNumber?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    callSign?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    flag?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    organizationId?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    shipFileNo?: Prisma.StringNullableFilter<"Vessel"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Vessel"> | Date | string;
};
export type VesselCreateWithoutCaptainInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    organization?: Prisma.OrganizationCreateNestedOneWithoutVesselsInput;
    inspections?: Prisma.InspectionReportCreateNestedManyWithoutVesselInput;
};
export type VesselUncheckedCreateWithoutCaptainInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    organizationId?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    inspections?: Prisma.InspectionReportUncheckedCreateNestedManyWithoutVesselInput;
};
export type VesselCreateOrConnectWithoutCaptainInput = {
    where: Prisma.VesselWhereUniqueInput;
    create: Prisma.XOR<Prisma.VesselCreateWithoutCaptainInput, Prisma.VesselUncheckedCreateWithoutCaptainInput>;
};
export type VesselUpsertWithoutCaptainInput = {
    update: Prisma.XOR<Prisma.VesselUpdateWithoutCaptainInput, Prisma.VesselUncheckedUpdateWithoutCaptainInput>;
    create: Prisma.XOR<Prisma.VesselCreateWithoutCaptainInput, Prisma.VesselUncheckedCreateWithoutCaptainInput>;
    where?: Prisma.VesselWhereInput;
};
export type VesselUpdateToOneWithWhereWithoutCaptainInput = {
    where?: Prisma.VesselWhereInput;
    data: Prisma.XOR<Prisma.VesselUpdateWithoutCaptainInput, Prisma.VesselUncheckedUpdateWithoutCaptainInput>;
};
export type VesselUpdateWithoutCaptainInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneWithoutVesselsNestedInput;
    inspections?: Prisma.InspectionReportUpdateManyWithoutVesselNestedInput;
};
export type VesselUncheckedUpdateWithoutCaptainInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    organizationId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inspections?: Prisma.InspectionReportUncheckedUpdateManyWithoutVesselNestedInput;
};
export type VesselCreateWithoutInspectionsInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    organization?: Prisma.OrganizationCreateNestedOneWithoutVesselsInput;
    captain?: Prisma.UserCreateNestedOneWithoutAssignedVesselInput;
};
export type VesselUncheckedCreateWithoutInspectionsInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    organizationId?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    captain?: Prisma.UserUncheckedCreateNestedOneWithoutAssignedVesselInput;
};
export type VesselCreateOrConnectWithoutInspectionsInput = {
    where: Prisma.VesselWhereUniqueInput;
    create: Prisma.XOR<Prisma.VesselCreateWithoutInspectionsInput, Prisma.VesselUncheckedCreateWithoutInspectionsInput>;
};
export type VesselUpsertWithoutInspectionsInput = {
    update: Prisma.XOR<Prisma.VesselUpdateWithoutInspectionsInput, Prisma.VesselUncheckedUpdateWithoutInspectionsInput>;
    create: Prisma.XOR<Prisma.VesselCreateWithoutInspectionsInput, Prisma.VesselUncheckedCreateWithoutInspectionsInput>;
    where?: Prisma.VesselWhereInput;
};
export type VesselUpdateToOneWithWhereWithoutInspectionsInput = {
    where?: Prisma.VesselWhereInput;
    data: Prisma.XOR<Prisma.VesselUpdateWithoutInspectionsInput, Prisma.VesselUncheckedUpdateWithoutInspectionsInput>;
};
export type VesselUpdateWithoutInspectionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneWithoutVesselsNestedInput;
    captain?: Prisma.UserUpdateOneWithoutAssignedVesselNestedInput;
};
export type VesselUncheckedUpdateWithoutInspectionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    organizationId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    captain?: Prisma.UserUncheckedUpdateOneWithoutAssignedVesselNestedInput;
};
export type VesselCreateManyOrganizationInput = {
    id?: string;
    name: string;
    imoNumber?: string | null;
    callSign?: string | null;
    flag?: string | null;
    shipFileNo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type VesselUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    captain?: Prisma.UserUpdateOneWithoutAssignedVesselNestedInput;
    inspections?: Prisma.InspectionReportUpdateManyWithoutVesselNestedInput;
};
export type VesselUncheckedUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    captain?: Prisma.UserUncheckedUpdateOneWithoutAssignedVesselNestedInput;
    inspections?: Prisma.InspectionReportUncheckedUpdateManyWithoutVesselNestedInput;
};
export type VesselUncheckedUpdateManyWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    imoNumber?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    callSign?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    flag?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    shipFileNo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type VesselCountOutputType
 */
export type VesselCountOutputType = {
    inspections: number;
};
export type VesselCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    inspections?: boolean | VesselCountOutputTypeCountInspectionsArgs;
};
/**
 * VesselCountOutputType without action
 */
export type VesselCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VesselCountOutputType
     */
    select?: Prisma.VesselCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * VesselCountOutputType without action
 */
export type VesselCountOutputTypeCountInspectionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InspectionReportWhereInput;
};
export type VesselSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    imoNumber?: boolean;
    callSign?: boolean;
    flag?: boolean;
    organizationId?: boolean;
    shipFileNo?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
    captain?: boolean | Prisma.Vessel$captainArgs<ExtArgs>;
    inspections?: boolean | Prisma.Vessel$inspectionsArgs<ExtArgs>;
    _count?: boolean | Prisma.VesselCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["vessel"]>;
export type VesselSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    imoNumber?: boolean;
    callSign?: boolean;
    flag?: boolean;
    organizationId?: boolean;
    shipFileNo?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
}, ExtArgs["result"]["vessel"]>;
export type VesselSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    imoNumber?: boolean;
    callSign?: boolean;
    flag?: boolean;
    organizationId?: boolean;
    shipFileNo?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
}, ExtArgs["result"]["vessel"]>;
export type VesselSelectScalar = {
    id?: boolean;
    name?: boolean;
    imoNumber?: boolean;
    callSign?: boolean;
    flag?: boolean;
    organizationId?: boolean;
    shipFileNo?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type VesselOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "imoNumber" | "callSign" | "flag" | "organizationId" | "shipFileNo" | "createdAt" | "updatedAt", ExtArgs["result"]["vessel"]>;
export type VesselInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
    captain?: boolean | Prisma.Vessel$captainArgs<ExtArgs>;
    inspections?: boolean | Prisma.Vessel$inspectionsArgs<ExtArgs>;
    _count?: boolean | Prisma.VesselCountOutputTypeDefaultArgs<ExtArgs>;
};
export type VesselIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
};
export type VesselIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.Vessel$organizationArgs<ExtArgs>;
};
export type $VesselPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Vessel";
    objects: {
        organization: Prisma.$OrganizationPayload<ExtArgs> | null;
        captain: Prisma.$UserPayload<ExtArgs> | null;
        inspections: Prisma.$InspectionReportPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        imoNumber: string | null;
        callSign: string | null;
        flag: string | null;
        organizationId: string | null;
        shipFileNo: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["vessel"]>;
    composites: {};
};
export type VesselGetPayload<S extends boolean | null | undefined | VesselDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$VesselPayload, S>;
export type VesselCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<VesselFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: VesselCountAggregateInputType | true;
};
export interface VesselDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Vessel'];
        meta: {
            name: 'Vessel';
        };
    };
    /**
     * Find zero or one Vessel that matches the filter.
     * @param {VesselFindUniqueArgs} args - Arguments to find a Vessel
     * @example
     * // Get one Vessel
     * const vessel = await prisma.vessel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VesselFindUniqueArgs>(args: Prisma.SelectSubset<T, VesselFindUniqueArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Vessel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VesselFindUniqueOrThrowArgs} args - Arguments to find a Vessel
     * @example
     * // Get one Vessel
     * const vessel = await prisma.vessel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VesselFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, VesselFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Vessel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselFindFirstArgs} args - Arguments to find a Vessel
     * @example
     * // Get one Vessel
     * const vessel = await prisma.vessel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VesselFindFirstArgs>(args?: Prisma.SelectSubset<T, VesselFindFirstArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Vessel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselFindFirstOrThrowArgs} args - Arguments to find a Vessel
     * @example
     * // Get one Vessel
     * const vessel = await prisma.vessel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VesselFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, VesselFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Vessels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Vessels
     * const vessels = await prisma.vessel.findMany()
     *
     * // Get first 10 Vessels
     * const vessels = await prisma.vessel.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const vesselWithIdOnly = await prisma.vessel.findMany({ select: { id: true } })
     *
     */
    findMany<T extends VesselFindManyArgs>(args?: Prisma.SelectSubset<T, VesselFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Vessel.
     * @param {VesselCreateArgs} args - Arguments to create a Vessel.
     * @example
     * // Create one Vessel
     * const Vessel = await prisma.vessel.create({
     *   data: {
     *     // ... data to create a Vessel
     *   }
     * })
     *
     */
    create<T extends VesselCreateArgs>(args: Prisma.SelectSubset<T, VesselCreateArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Vessels.
     * @param {VesselCreateManyArgs} args - Arguments to create many Vessels.
     * @example
     * // Create many Vessels
     * const vessel = await prisma.vessel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends VesselCreateManyArgs>(args?: Prisma.SelectSubset<T, VesselCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Vessels and returns the data saved in the database.
     * @param {VesselCreateManyAndReturnArgs} args - Arguments to create many Vessels.
     * @example
     * // Create many Vessels
     * const vessel = await prisma.vessel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Vessels and only return the `id`
     * const vesselWithIdOnly = await prisma.vessel.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends VesselCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, VesselCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Vessel.
     * @param {VesselDeleteArgs} args - Arguments to delete one Vessel.
     * @example
     * // Delete one Vessel
     * const Vessel = await prisma.vessel.delete({
     *   where: {
     *     // ... filter to delete one Vessel
     *   }
     * })
     *
     */
    delete<T extends VesselDeleteArgs>(args: Prisma.SelectSubset<T, VesselDeleteArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Vessel.
     * @param {VesselUpdateArgs} args - Arguments to update one Vessel.
     * @example
     * // Update one Vessel
     * const vessel = await prisma.vessel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends VesselUpdateArgs>(args: Prisma.SelectSubset<T, VesselUpdateArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Vessels.
     * @param {VesselDeleteManyArgs} args - Arguments to filter Vessels to delete.
     * @example
     * // Delete a few Vessels
     * const { count } = await prisma.vessel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends VesselDeleteManyArgs>(args?: Prisma.SelectSubset<T, VesselDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Vessels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Vessels
     * const vessel = await prisma.vessel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends VesselUpdateManyArgs>(args: Prisma.SelectSubset<T, VesselUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Vessels and returns the data updated in the database.
     * @param {VesselUpdateManyAndReturnArgs} args - Arguments to update many Vessels.
     * @example
     * // Update many Vessels
     * const vessel = await prisma.vessel.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Vessels and only return the `id`
     * const vesselWithIdOnly = await prisma.vessel.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends VesselUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, VesselUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Vessel.
     * @param {VesselUpsertArgs} args - Arguments to update or create a Vessel.
     * @example
     * // Update or create a Vessel
     * const vessel = await prisma.vessel.upsert({
     *   create: {
     *     // ... data to create a Vessel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Vessel we want to update
     *   }
     * })
     */
    upsert<T extends VesselUpsertArgs>(args: Prisma.SelectSubset<T, VesselUpsertArgs<ExtArgs>>): Prisma.Prisma__VesselClient<runtime.Types.Result.GetResult<Prisma.$VesselPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Vessels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselCountArgs} args - Arguments to filter Vessels to count.
     * @example
     * // Count the number of Vessels
     * const count = await prisma.vessel.count({
     *   where: {
     *     // ... the filter for the Vessels we want to count
     *   }
     * })
    **/
    count<T extends VesselCountArgs>(args?: Prisma.Subset<T, VesselCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], VesselCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Vessel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VesselAggregateArgs>(args: Prisma.Subset<T, VesselAggregateArgs>): Prisma.PrismaPromise<GetVesselAggregateType<T>>;
    /**
     * Group by Vessel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VesselGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends VesselGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: VesselGroupByArgs['orderBy'];
    } : {
        orderBy?: VesselGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, VesselGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVesselGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Vessel model
     */
    readonly fields: VesselFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Vessel.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__VesselClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    organization<T extends Prisma.Vessel$organizationArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Vessel$organizationArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    captain<T extends Prisma.Vessel$captainArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Vessel$captainArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    inspections<T extends Prisma.Vessel$inspectionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Vessel$inspectionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InspectionReportPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the Vessel model
 */
export interface VesselFieldRefs {
    readonly id: Prisma.FieldRef<"Vessel", 'String'>;
    readonly name: Prisma.FieldRef<"Vessel", 'String'>;
    readonly imoNumber: Prisma.FieldRef<"Vessel", 'String'>;
    readonly callSign: Prisma.FieldRef<"Vessel", 'String'>;
    readonly flag: Prisma.FieldRef<"Vessel", 'String'>;
    readonly organizationId: Prisma.FieldRef<"Vessel", 'String'>;
    readonly shipFileNo: Prisma.FieldRef<"Vessel", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Vessel", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Vessel", 'DateTime'>;
}
/**
 * Vessel findUnique
 */
export type VesselFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter, which Vessel to fetch.
     */
    where: Prisma.VesselWhereUniqueInput;
};
/**
 * Vessel findUniqueOrThrow
 */
export type VesselFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter, which Vessel to fetch.
     */
    where: Prisma.VesselWhereUniqueInput;
};
/**
 * Vessel findFirst
 */
export type VesselFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter, which Vessel to fetch.
     */
    where?: Prisma.VesselWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Vessels to fetch.
     */
    orderBy?: Prisma.VesselOrderByWithRelationInput | Prisma.VesselOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Vessels.
     */
    cursor?: Prisma.VesselWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Vessels from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Vessels.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Vessels.
     */
    distinct?: Prisma.VesselScalarFieldEnum | Prisma.VesselScalarFieldEnum[];
};
/**
 * Vessel findFirstOrThrow
 */
export type VesselFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter, which Vessel to fetch.
     */
    where?: Prisma.VesselWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Vessels to fetch.
     */
    orderBy?: Prisma.VesselOrderByWithRelationInput | Prisma.VesselOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Vessels.
     */
    cursor?: Prisma.VesselWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Vessels from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Vessels.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Vessels.
     */
    distinct?: Prisma.VesselScalarFieldEnum | Prisma.VesselScalarFieldEnum[];
};
/**
 * Vessel findMany
 */
export type VesselFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter, which Vessels to fetch.
     */
    where?: Prisma.VesselWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Vessels to fetch.
     */
    orderBy?: Prisma.VesselOrderByWithRelationInput | Prisma.VesselOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Vessels.
     */
    cursor?: Prisma.VesselWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Vessels from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Vessels.
     */
    skip?: number;
    distinct?: Prisma.VesselScalarFieldEnum | Prisma.VesselScalarFieldEnum[];
};
/**
 * Vessel create
 */
export type VesselCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * The data needed to create a Vessel.
     */
    data: Prisma.XOR<Prisma.VesselCreateInput, Prisma.VesselUncheckedCreateInput>;
};
/**
 * Vessel createMany
 */
export type VesselCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Vessels.
     */
    data: Prisma.VesselCreateManyInput | Prisma.VesselCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Vessel createManyAndReturn
 */
export type VesselCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * The data used to create many Vessels.
     */
    data: Prisma.VesselCreateManyInput | Prisma.VesselCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * Vessel update
 */
export type VesselUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * The data needed to update a Vessel.
     */
    data: Prisma.XOR<Prisma.VesselUpdateInput, Prisma.VesselUncheckedUpdateInput>;
    /**
     * Choose, which Vessel to update.
     */
    where: Prisma.VesselWhereUniqueInput;
};
/**
 * Vessel updateMany
 */
export type VesselUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Vessels.
     */
    data: Prisma.XOR<Prisma.VesselUpdateManyMutationInput, Prisma.VesselUncheckedUpdateManyInput>;
    /**
     * Filter which Vessels to update
     */
    where?: Prisma.VesselWhereInput;
    /**
     * Limit how many Vessels to update.
     */
    limit?: number;
};
/**
 * Vessel updateManyAndReturn
 */
export type VesselUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * The data used to update Vessels.
     */
    data: Prisma.XOR<Prisma.VesselUpdateManyMutationInput, Prisma.VesselUncheckedUpdateManyInput>;
    /**
     * Filter which Vessels to update
     */
    where?: Prisma.VesselWhereInput;
    /**
     * Limit how many Vessels to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * Vessel upsert
 */
export type VesselUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * The filter to search for the Vessel to update in case it exists.
     */
    where: Prisma.VesselWhereUniqueInput;
    /**
     * In case the Vessel found by the `where` argument doesn't exist, create a new Vessel with this data.
     */
    create: Prisma.XOR<Prisma.VesselCreateInput, Prisma.VesselUncheckedCreateInput>;
    /**
     * In case the Vessel was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.VesselUpdateInput, Prisma.VesselUncheckedUpdateInput>;
};
/**
 * Vessel delete
 */
export type VesselDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
    /**
     * Filter which Vessel to delete.
     */
    where: Prisma.VesselWhereUniqueInput;
};
/**
 * Vessel deleteMany
 */
export type VesselDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Vessels to delete
     */
    where?: Prisma.VesselWhereInput;
    /**
     * Limit how many Vessels to delete.
     */
    limit?: number;
};
/**
 * Vessel.organization
 */
export type Vessel$organizationArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Organization
     */
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Organization
     */
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where?: Prisma.OrganizationWhereInput;
};
/**
 * Vessel.captain
 */
export type Vessel$captainArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: Prisma.UserSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the User
     */
    omit?: Prisma.UserOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
};
/**
 * Vessel.inspections
 */
export type Vessel$inspectionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InspectionReport
     */
    select?: Prisma.InspectionReportSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InspectionReport
     */
    omit?: Prisma.InspectionReportOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.InspectionReportInclude<ExtArgs> | null;
    where?: Prisma.InspectionReportWhereInput;
    orderBy?: Prisma.InspectionReportOrderByWithRelationInput | Prisma.InspectionReportOrderByWithRelationInput[];
    cursor?: Prisma.InspectionReportWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InspectionReportScalarFieldEnum | Prisma.InspectionReportScalarFieldEnum[];
};
/**
 * Vessel without action
 */
export type VesselDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Vessel
     */
    select?: Prisma.VesselSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Vessel
     */
    omit?: Prisma.VesselOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.VesselInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=Vessel.d.ts.map