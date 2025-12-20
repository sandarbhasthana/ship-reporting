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
  Modal,
  Row,
  Col
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  CrownOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useParams, useNavigate, Link } from "react-router";
import dayjs from "dayjs";
import {
  FloatingInput,
  FloatingSelect,
  FloatingDatePicker
} from "../../components";
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
  officeSignUserRole?: string | null;
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

  // Both admins and captains can edit all ship staff columns
  // Admins can additionally edit company analysis and remarks
  // Calculate text column width based on role (equal distribution)
  const textColumnWidth = isAdmin ? "13%" : "20%";

  const entryColumns = [
    {
      title: "Sr No.",
      dataIndex: "srNo",
      width: 55,
      render: (_: unknown, record: InspectionEntry) => (
        <Input
          value={record.srNo}
          onChange={(e) => updateEntry(record.key!, "srNo", e.target.value)}
          maxLength={5}
          className={styles.srNoInput}
        />
      )
    },
    {
      title: "Deficiency",
      dataIndex: "deficiency",
      width: textColumnWidth,
      render: (_: unknown, record: InspectionEntry) =>
        renderTextCell(record, "deficiency", "Deficiency")
    },
    {
      title: "Master Cause Analysis",
      dataIndex: "mastersCauseAnalysis",
      width: textColumnWidth,
      render: (_: unknown, record: InspectionEntry) =>
        renderTextCell(
          record,
          "mastersCauseAnalysis",
          "Master's Cause Analysis"
        )
    },
    {
      title: "Corrective Action",
      dataIndex: "correctiveAction",
      width: textColumnWidth,
      render: (_: unknown, record: InspectionEntry) =>
        renderTextCell(record, "correctiveAction", "Corrective Action")
    },
    {
      title: "Preventive Action",
      dataIndex: "preventiveAction",
      width: textColumnWidth,
      render: (_: unknown, record: InspectionEntry) =>
        renderTextCell(record, "preventiveAction", "Preventive Action")
    },
    {
      title: "Date",
      dataIndex: "completionDate",
      width: 100,
      render: (_: unknown, record: InspectionEntry) => (
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
      )
    }
  ];

  // Add office-only columns for admin
  if (isAdmin) {
    entryColumns.push(
      {
        title: "Company Analysis",
        dataIndex: "companyAnalysis",
        width: textColumnWidth,
        render: (_: unknown, record: InspectionEntry) =>
          renderTextCell(record, "companyAnalysis", "Company Analysis")
      },
      {
        title: "Remarks",
        dataIndex: "remarks",
        width: 210,
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
                  if (val !== "OPEN" && !record.officeSignUserId) {
                    updateEntryMultiple(record.key!, {
                      status: val,
                      officeSignUserId: identity?.id || null,
                      officeSignUserName: identity?.name || null,
                      officeSignUserRole: identity?.role || null
                    });
                  } else {
                    updateEntry(record.key!, "status", val);
                  }
                }}
                size="small"
                popupClassName={styles.statusDropdown}
                className={`${styles.remarksSelect} ${
                  record.status === "OPEN"
                    ? styles.statusOpen
                    : record.status === "FURTHER_ACTION_NEEDED"
                      ? styles.statusActionNeeded
                      : styles.statusClosed
                }`}
              >
                <Select.Option value="OPEN">
                  <span className={styles.statusOpen}>Open</span>
                </Select.Option>
                <Select.Option value="FURTHER_ACTION_NEEDED">
                  <span className={styles.statusActionNeeded}>
                    Action Needed
                  </span>
                </Select.Option>
                <Select.Option value="CLOSED_SATISFACTORILY">
                  <span className={styles.statusClosed}>Closed</span>
                </Select.Option>
              </Select>
            </div>
            <div className={styles.remarksRow}>
              <Text type="secondary" className={styles.remarksLabel}>
                Sign:
              </Text>
              {record.officeSignUserName ? (
                <span
                  className={`${styles.userBadge} ${
                    record.officeSignUserRole === "ADMIN"
                      ? styles.adminBadge
                      : styles.captainBadge
                  }`}
                >
                  {record.officeSignUserRole === "ADMIN" ? (
                    <CrownOutlined className={styles.badgeIcon} />
                  ) : (
                    <UserOutlined className={styles.badgeIcon} />
                  )}
                  {record.officeSignUserName}
                </span>
              ) : (
                <span className={styles.remarksValue}>-</span>
              )}
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

  // Add delete column for both admins and captains
  entryColumns.push({
    title: "",
    width: 40,
    render: (_: unknown, record: InspectionEntry) => (
      <Popconfirm
        title="Remove entry?"
        onConfirm={() => removeEntry(record.key!)}
      >
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          className={styles.deleteButton}
        />
      </Popconfirm>
    )
  } as (typeof entryColumns)[0]);

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
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="vesselId"
                rules={[{ required: true, message: "Please select a vessel" }]}
              >
                <FloatingSelect
                  label="Vessel"
                  required
                  options={vessels.map((v) => ({ label: v.name, value: v.id }))}
                  disabled={isEdit || Boolean(identity?.assignedVesselId)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="inspectedBy">
                <FloatingSelect
                  label="Inspection Type"
                  allowClear
                  options={[
                    { label: "PSC", value: "PSC" },
                    { label: "SIRE", value: "SIRE" },
                    { label: "FLAG", value: "FLAG" },
                    { label: "TERMINAL", value: "TERMINAL" },
                    { label: "RIGHTSHIP", value: "RIGHTSHIP" }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="inspectionDate">
                <FloatingDatePicker label="Inspection Date" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="shipFileNo">
                <FloatingInput label="Ship's File No" />
              </Form.Item>
            </Col>
          </Row>
          {isAdmin && (
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="officeFileNo">
                  <FloatingInput label="Office File No" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="revisionNo">
                  <FloatingInput label="Revision No" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="formNo">
                  <FloatingInput label="Form No" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </div>

        <div className={styles.formSection}>
          <div className={styles.entriesSectionHeader}>
            <Title level={5} className={styles.formSectionTitle}>
              Deficiency Entries
            </Title>
            <Button
              type="primary"
              onClick={addEntry}
              icon={<PlusOutlined />}
              disabled={entries.length >= 100}
            >
              Add Entry {entries.length >= 100 && "(Max 100)"}
            </Button>
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
