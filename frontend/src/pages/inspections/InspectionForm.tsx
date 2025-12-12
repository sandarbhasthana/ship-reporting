import { useCallback, useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  Table,
  Typography,
  Space,
  message,
  Spin,
  Popconfirm,
  Modal
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useParams, useNavigate, Link } from "react-router";
import dayjs from "dayjs";
import styles from "./inspections.module.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const MAX_CHARS = 1000;

// Modal state interface
interface TextModalState {
  open: boolean;
  entryKey: string;
  field: string;
  label: string;
  value: string;
}

interface InspectionEntry {
  id?: string;
  key?: string;
  srNo: string;
  deficiency: string;
  mastersCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  completionDate?: string | null;
  companyAnalysis?: string;
  status: string;
  officeSignUserId?: string | null;
  officeSignUserName?: string | null;
  officeSignDate?: string | null;
}

interface Vessel {
  id: string;
  name: string;
  shipFileNo?: string;
}

interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedVesselId?: string;
}

export const InspectionForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";
  const isEdit = Boolean(id);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [entries, setEntries] = useState<InspectionEntry[]>([]);
  const [textModal, setTextModal] = useState<TextModalState>({
    open: false,
    entryKey: "",
    field: "",
    label: "",
    value: ""
  });

  // Open the text modal for editing
  const openTextModal = (
    entryKey: string,
    field: string,
    label: string,
    currentValue: string
  ) => {
    setTextModal({
      open: true,
      entryKey,
      field,
      label,
      value: currentValue || ""
    });
  };

  // Handle modal text change
  const handleModalTextChange = (newValue: string) => {
    if (newValue.length <= MAX_CHARS) {
      setTextModal((prev) => ({ ...prev, value: newValue }));
    }
  };

  // Save and close modal
  const handleModalSave = () => {
    updateEntry(textModal.entryKey, textModal.field, textModal.value);
    setTextModal((prev) => ({ ...prev, open: false }));
  };

  // Cancel and close modal
  const handleModalCancel = () => {
    setTextModal((prev) => ({ ...prev, open: false }));
  };

  // Truncate text for display in table cell
  const truncateText = (text: string | undefined, maxLength: number = 50) => {
    if (!text) return <Text type="secondary">Click to add...</Text>;
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Render a clickable text cell
  const renderTextCell = (
    record: InspectionEntry,
    field: keyof InspectionEntry,
    label: string
  ) => {
    const value = record[field] as string | undefined;
    return (
      <div
        className={styles.textCellContainer}
        onClick={() => openTextModal(record.key!, field, label, value || "")}
      >
        <div className={styles.textCellContent}>{truncateText(value)}</div>
        <EditOutlined className={styles.textCellIcon} />
      </div>
    );
  };

  const fetchVessels = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/vessels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVessels(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch vessels:", error);
    }
  }, [apiUrl]);

  const fetchInspection = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${apiUrl}/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        form.setFieldsValue({
          vesselId: data.vesselId,
          inspectedBy: data.inspectedBy,
          inspectionDate: data.inspectionDate
            ? dayjs(data.inspectionDate)
            : null,
          shipFileNo: data.shipFileNo,
          officeFileNo: data.officeFileNo,
          revisionNo: data.revisionNo,
          formNo: data.formNo,
          applicableFomSections: data.applicableFomSections
        });
        setEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.entries || []).map((e: any, idx: number) => ({
            ...e,
            key: e.id || `new-${idx}`,
            completionDate: e.completionDate,
            officeSignUserId: e.officeSignUserId,
            officeSignUserName: e.officeSignUser?.name || null,
            officeSignDate: e.officeSignDate
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch inspection:", error);
      message.error("Failed to load inspection");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id, form]);

  useEffect(() => {
    fetchVessels();
    if (isEdit) {
      fetchInspection();
    } else {
      // For captain, auto-set their vessel
      if (!isAdmin && identity?.assignedVesselId) {
        form.setFieldValue("vesselId", identity.assignedVesselId);
      }
    }
  }, [fetchVessels, fetchInspection, isEdit, isAdmin, identity, form]);

  const addEntry = () => {
    const newEntry: InspectionEntry = {
      key: `new-${Date.now()}`,
      srNo: String(entries.length + 1),
      deficiency: "",
      status: "OPEN"
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (key: string) => {
    setEntries(entries.filter((e) => e.key !== key));
  };

  const updateEntry = (key: string, field: string, value: unknown) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, [field]: value } : e))
    );
  };

  const updateEntryMultiple = (
    key: string,
    updates: Record<string, unknown>
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...updates } : e))
    );
  };

  const handleSave = async (values: Record<string, unknown>) => {
    console.log("handleSave called with:", values);
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      console.log("Token:", token ? "exists" : "missing");
      const payload = {
        ...values,
        inspectionDate: values.inspectionDate
          ? (values.inspectionDate as dayjs.Dayjs).toISOString()
          : null,
        entries: entries.map((e) => ({
          srNo: e.srNo,
          deficiency: e.deficiency,
          mastersCauseAnalysis: e.mastersCauseAnalysis,
          correctiveAction: e.correctiveAction,
          preventiveAction: e.preventiveAction,
          completionDate: e.completionDate || null,
          companyAnalysis: e.companyAnalysis,
          status: e.status,
          officeSignUserId: e.officeSignUserId || null,
          officeSignDate: e.officeSignDate || null
        }))
      };

      const url = isEdit
        ? `${apiUrl}/inspections/${id}`
        : `${apiUrl}/inspections`;
      const method = isEdit ? "PATCH" : "POST";

      console.log("Sending request to:", url);
      console.log("Method:", method);
      console.log("Payload:", payload);
      console.log(
        "Entries with sign data:",
        payload.entries.map(
          (e: {
            srNo: string;
            officeSignUserId: string | null;
            officeSignDate: string | null;
          }) => ({
            srNo: e.srNo,
            officeSignUserId: e.officeSignUserId,
            officeSignDate: e.officeSignDate
          })
        )
      );

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        message.success(
          `Inspection ${isEdit ? "updated" : "created"} successfully`
        );
        navigate("/inspections");
      } else {
        const error = await response.json();
        console.log("Error response:", JSON.stringify(error, null, 2));
        const errorMsg = Array.isArray(error.message)
          ? error.message.join(", ")
          : error.message;
        message.error(errorMsg || "Failed to save inspection");
      }
    } catch (err) {
      console.error("Caught error:", err);
      message.error("Failed to save inspection");
    } finally {
      setSaving(false);
    }
  };

  // Check if admin can edit captain columns (only captains can edit columns 1-6)
  const canEditCaptainColumns = !isAdmin;

  const entryColumns = [
    {
      title: "Sr No.",
      dataIndex: "srNo",
      width: 65,
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          <Input
            value={record.srNo}
            onChange={(e) => updateEntry(record.key!, "srNo", e.target.value)}
            maxLength={5}
            className={styles.srNoInput}
          />
        ) : (
          <Text>{record.srNo}</Text>
        )
    },
    {
      title: "Deficiency",
      dataIndex: "deficiency",
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          renderTextCell(record, "deficiency", "Deficiency")
        ) : (
          <Text className={styles.readOnlyText}>
            {record.deficiency || "-"}
          </Text>
        )
    },
    {
      title: "Master Cause Analysis",
      dataIndex: "mastersCauseAnalysis",
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          renderTextCell(
            record,
            "mastersCauseAnalysis",
            "Master's Cause Analysis"
          )
        ) : (
          <Text className={styles.readOnlyText}>
            {record.mastersCauseAnalysis || "-"}
          </Text>
        )
    },
    {
      title: "Corrective Action",
      dataIndex: "correctiveAction",
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          renderTextCell(record, "correctiveAction", "Corrective Action")
        ) : (
          <Text className={styles.readOnlyText}>
            {record.correctiveAction || "-"}
          </Text>
        )
    },
    {
      title: "Preventive Action",
      dataIndex: "preventiveAction",
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          renderTextCell(record, "preventiveAction", "Preventive Action")
        ) : (
          <Text className={styles.readOnlyText}>
            {record.preventiveAction || "-"}
          </Text>
        )
    },
    {
      title: "Date",
      dataIndex: "completionDate",
      width: 115,
      render: (_: unknown, record: InspectionEntry) =>
        canEditCaptainColumns ? (
          <DatePicker
            value={record.completionDate ? dayjs(record.completionDate) : null}
            onChange={(date) =>
              updateEntry(
                record.key!,
                "completionDate",
                date?.toISOString() || null
              )
            }
            format="DD/MM/YY"
            className={styles.datePickerCompact}
          />
        ) : (
          <Text>
            {record.completionDate
              ? dayjs(record.completionDate).format("DD/MM/YY")
              : "-"}
          </Text>
        )
    }
  ];

  // Add office-only columns for admin
  if (isAdmin) {
    entryColumns.push(
      {
        title: "Company Analysis",
        dataIndex: "companyAnalysis",
        render: (_: unknown, record: InspectionEntry) =>
          renderTextCell(record, "companyAnalysis", "Company Analysis")
      },
      {
        title: "Remarks",
        dataIndex: "remarks",
        width: 200,
        render: (_: unknown, record: InspectionEntry) => (
          <div className={styles.remarksCell}>
            <div className={styles.remarksRow}>
              <Text type="secondary" className={styles.remarksLabel}>
                Status:
              </Text>
              <Select
                value={record.status}
                onChange={(val) => {
                  // Auto-populate sign when status changes from OPEN
                  console.log("Status change:", {
                    val,
                    currentStatus: record.status,
                    officeSignUserId: record.officeSignUserId,
                    identityId: identity?.id,
                    identityName: identity?.name
                  });
                  if (val !== "OPEN" && !record.officeSignUserId) {
                    console.log(
                      "Auto-populating sign with:",
                      identity?.id,
                      identity?.name
                    );
                    updateEntryMultiple(record.key!, {
                      status: val,
                      officeSignUserId: identity?.id || null,
                      officeSignUserName: identity?.name || null
                    });
                  } else {
                    updateEntry(record.key!, "status", val);
                  }
                }}
                options={[
                  { label: "Open", value: "OPEN" },
                  { label: "Action Needed", value: "FURTHER_ACTION_NEEDED" },
                  { label: "Closed", value: "CLOSED_SATISFACTORILY" }
                ]}
                size="small"
                className={styles.remarksSelect}
              />
            </div>
            <div className={styles.remarksRow}>
              <Text type="secondary" className={styles.remarksLabel}>
                Sign:
              </Text>
              <Text className={styles.remarksValue}>
                {record.officeSignUserName || "-"}
              </Text>
            </div>
            <div className={styles.remarksRow}>
              <Text type="secondary" className={styles.remarksLabel}>
                Date:
              </Text>
              <DatePicker
                value={
                  record.officeSignDate ? dayjs(record.officeSignDate) : null
                }
                onChange={(date) =>
                  updateEntry(
                    record.key!,
                    "officeSignDate",
                    date?.toISOString() || null
                  )
                }
                format="DD/MM/YY"
                size="small"
                className={styles.remarksDatePicker}
              />
            </div>
          </div>
        )
      }
    );
  }

  // Add delete column (only for captains, not admins)
  if (!isAdmin) {
    entryColumns.push({
      title: "",
      width: 40,
      render: (_: unknown, record: InspectionEntry) => (
        <Popconfirm
          title="Remove entry?"
          onConfirm={() => removeEntry(record.key!)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    } as (typeof entryColumns)[0]);
  }

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card>
      <Space
        direction="vertical"
        size="large"
        className={styles.headerContainer}
      >
        <div>
          <Link to="/inspections">
            <Button icon={<ArrowLeftOutlined />} type="default">
              Back to List
            </Button>
          </Link>
          <Title
            level={4}
            className={styles.headerTitle}
            style={{ marginTop: 16 }}
          >
            {isEdit ? "Edit" : "Create"} Inspection Report
          </Title>
        </div>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onFinishFailed={(errorInfo) => {
          console.log("Form validation failed:", errorInfo);
          message.error("Please fill in all required fields");
        }}
      >
        <div className={styles.formSection}>
          <Title level={5} className={styles.formSectionTitle}>
            Header Information
          </Title>
          <Space wrap size="large">
            <Form.Item
              name="vesselId"
              label="Vessel"
              rules={[{ required: true, message: "Please select a vessel" }]}
            >
              <Select
                placeholder="Select vessel"
                options={vessels.map((v) => ({ label: v.name, value: v.id }))}
                disabled={isEdit || Boolean(identity?.assignedVesselId)}
                className={styles.filterSelect}
              />
            </Form.Item>
            <Form.Item name="inspectedBy" label="Inspected By">
              <Input
                placeholder="e.g., RIGHTSHIP"
                disabled={isAdmin && isEdit}
              />
            </Form.Item>
            <Form.Item name="inspectionDate" label="Inspection Date">
              <DatePicker format="DD/MM/YYYY" disabled={isAdmin && isEdit} />
            </Form.Item>
            <Form.Item name="shipFileNo" label="Ship's File No">
              <Input placeholder="e.g., 123.4.5" disabled={isAdmin && isEdit} />
            </Form.Item>
            {isAdmin && (
              <>
                <Form.Item name="officeFileNo" label="Office File No">
                  <Input placeholder="e.g., 180.2.10" />
                </Form.Item>
                <Form.Item name="revisionNo" label="Revision No">
                  <Input placeholder="e.g., 1" />
                </Form.Item>
                <Form.Item name="formNo" label="Form No">
                  <Input placeholder="e.g., 1.11" />
                </Form.Item>
              </>
            )}
          </Space>
        </div>

        <div className={styles.formSection}>
          <div className={styles.entriesSectionHeader}>
            <Title level={5} className={styles.formSectionTitle}>
              Deficiency Entries
            </Title>
            {!isAdmin && (
              <Button
                type="primary"
                onClick={addEntry}
                icon={<PlusOutlined />}
                disabled={entries.length >= 100}
              >
                Add Entry {entries.length >= 100 && "(Max 100)"}
              </Button>
            )}
          </div>
          <Table
            columns={entryColumns}
            dataSource={entries}
            rowKey="key"
            pagination={false}
            size="small"
            className={styles.entriesTableCompact}
          />
        </div>

        <div className={styles.formActions}>
          <Link to="/inspections">
            <Button>Cancel</Button>
          </Link>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => {
              form
                .validateFields()
                .then((values) => {
                  handleSave(values);
                })
                .catch((err) => {
                  console.log("Validation failed:", err);
                  message.error("Please fill in all required fields");
                });
            }}
          >
            {isEdit ? "Update" : "Create"} Inspection
          </Button>
        </div>
      </Form>

      {/* Text editing modal */}
      <Modal
        title={textModal.label}
        open={textModal.open}
        onOk={handleModalSave}
        onCancel={handleModalCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <div className={styles.textModalContent}>
          <TextArea
            value={textModal.value}
            onChange={(e) => handleModalTextChange(e.target.value)}
            rows={10}
            placeholder={`Enter ${textModal.label.toLowerCase()}...`}
            className={styles.textModalTextarea}
          />
          <div className={styles.charCounter}>
            <Text
              type={
                textModal.value.length >= MAX_CHARS ? "danger" : "secondary"
              }
            >
              {textModal.value.length} / {MAX_CHARS} characters
            </Text>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
