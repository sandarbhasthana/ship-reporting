import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Button,
  Table,
  Typography,
  Space,
  Tag,
  Descriptions,
  Spin,
  message,
  Modal
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  ExpandOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useParams, Link, useLocation } from "react-router";
import dayjs from "dayjs";
import { S3Image } from "../../components";
import styles from "./inspections.module.css";

const { Title, Text } = Typography;

// Constants for text truncation
const MAX_TEXT_LENGTH = 200;

interface InspectionEntry {
  id: string;
  srNo: string;
  deficiency: string;
  mastersCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  completionDate?: string;
  companyAnalysis?: string;
  status: string;
  officeSignDate?: string;
  officeSignUser?: { name: string; signatureImage?: string };
}

interface InspectionReport {
  id: string;
  title: string;
  vesselId: string;
  vessel?: { id: string; name: string; shipFileNo?: string };
  shipFileNo?: string;
  officeFileNo?: string;
  revisionNo?: string;
  formNo?: string;
  applicableFomSections?: string;
  inspectedBy?: string;
  inspectionDate?: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  entries: InspectionEntry[];
}

interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const InspectionView = () => {
  const { id } = useParams<{ id: string }>();
  const apiUrl = useApiUrl();
  const location = useLocation();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";

  // Check if navigated from audit logs
  const fromAuditLogs =
    (location.state as { from?: string })?.from === "audit-logs";

  const [inspection, setInspection] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTextModal, setExpandedTextModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
  }>({ visible: false, title: "", content: "" });

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
        setInspection(data);
      } else {
        message.error("Failed to load inspection");
      }
    } catch (error) {
      console.error("Failed to fetch inspection:", error);
      message.error("Failed to load inspection");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      OPEN: { color: "orange", text: "Open" },
      FURTHER_ACTION_NEEDED: { color: "red", text: "Further Action Needed" },
      CLOSED_SATISFACTORILY: { color: "green", text: "Closed Satisfactorily" }
    };
    const { color, text } = config[status] || {
      color: "default",
      text: status
    };
    return <Tag color={color}>{text}</Tag>;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      const token = localStorage.getItem("access_token");
      message.loading({ content: "Generating PDF...", key: "pdf-export" });

      const response = await fetch(`${apiUrl}/inspections/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inspection-report-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        message.success({
          content: "PDF downloaded successfully!",
          key: "pdf-export"
        });
      } else {
        const error = await response.json();
        message.error({
          content: error.message || "Failed to generate PDF",
          key: "pdf-export"
        });
      }
    } catch (err) {
      console.error("PDF export error:", err);
      message.error({ content: "Failed to generate PDF", key: "pdf-export" });
    }
  };

  // Truncate text and show Read More link if content exceeds MAX_TEXT_LENGTH
  const renderTruncatedText = (
    text: string | undefined,
    title: string
  ): React.ReactNode => {
    if (!text) return "-";

    const needsTruncation = text.length > MAX_TEXT_LENGTH;

    if (!needsTruncation) {
      return <span className={styles.viewCellText}>{text}</span>;
    }

    const truncatedText = text.substring(0, MAX_TEXT_LENGTH);

    return (
      <div className={styles.truncatedTextContainer}>
        <span className={styles.viewCellText}>
          {truncatedText}
          <span className={styles.ellipsis}>...</span>
        </span>
        <Button
          type="link"
          size="small"
          className={styles.readMoreButton}
          icon={<ExpandOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setExpandedTextModal({
              visible: true,
              title,
              content: text
            });
          }}
        >
          Read more
        </Button>
      </div>
    );
  };

  // Ship Staff columns (first 6 columns)
  const shipStaffColumns = [
    { title: "SR No", dataIndex: "srNo", key: "srNo", width: 60 },
    {
      title: "Deficiency",
      dataIndex: "deficiency",
      key: "deficiency",
      width: 140,
      render: (text: string) => renderTruncatedText(text, "Deficiency")
    },
    {
      title: "Master's Cause Analysis",
      dataIndex: "mastersCauseAnalysis",
      key: "mastersCauseAnalysis",
      width: 140,
      render: (text: string) =>
        renderTruncatedText(text, "Master's Cause Analysis")
    },
    {
      title: "Corrective Action",
      dataIndex: "correctiveAction",
      key: "correctiveAction",
      width: 140,
      render: (text: string) => renderTruncatedText(text, "Corrective Action")
    },
    {
      title: "Preventive Action",
      dataIndex: "preventiveAction",
      key: "preventiveAction",
      width: 140,
      render: (text: string) => renderTruncatedText(text, "Preventive Action")
    },
    {
      title: "Compl. Date",
      dataIndex: "completionDate",
      key: "completionDate",
      width: 100,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-")
    }
  ];

  // Office columns (last 2 columns - for Admin only)
  const officeColumns = isAdmin
    ? [
        {
          title: "Company Analysis",
          dataIndex: "companyAnalysis",
          key: "companyAnalysis",
          width: 200,
          render: (text: string) =>
            renderTruncatedText(text, "Company Analysis")
        },
        {
          title: "Remarks*",
          key: "remarks",
          width: 180,
          render: (_: unknown, record: InspectionEntry) => (
            <div className={styles.remarksViewCell}>
              <div className={styles.remarksViewRow}>
                <Text type="secondary" className={styles.remarksViewLabel}>
                  Status:
                </Text>
                {getStatusTag(record.status)}
              </div>
              <div className={styles.remarksViewRow}>
                <Text type="secondary" className={styles.remarksViewLabel}>
                  Sign:
                </Text>
                {record.officeSignUser?.signatureImage ? (
                  <S3Image
                    src={record.officeSignUser.signatureImage}
                    alt={`${record.officeSignUser.name}'s signature`}
                    style={{ maxHeight: 40, maxWidth: 100 }}
                    fallback={
                      <Tag color="blue">{record.officeSignUser.name}</Tag>
                    }
                  />
                ) : record.officeSignUser?.name ? (
                  <Tag color="blue">{record.officeSignUser.name}</Tag>
                ) : (
                  <Text>-</Text>
                )}
              </div>
              <div className={styles.remarksViewRow}>
                <Text type="secondary" className={styles.remarksViewLabel}>
                  Date:
                </Text>
                <Text>
                  {record.officeSignDate
                    ? dayjs(record.officeSignDate).format("DD/MM/YYYY")
                    : "-"}
                </Text>
              </div>
            </div>
          )
        }
      ]
    : [
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          width: 140,
          render: (status: string) => getStatusTag(status)
        }
      ];

  // Build columns with group headers
  const columns = isAdmin
    ? [
        {
          title: "SHIP STAFF",
          children: shipStaffColumns
        },
        {
          title: "OFFICE",
          children: officeColumns
        }
      ]
    : [...shipStaffColumns, ...officeColumns];

  if (loading) {
    return (
      <Card>
        <Spin size="large" />
      </Card>
    );
  }

  if (!inspection) {
    return (
      <Card>
        <Text>Inspection not found</Text>
      </Card>
    );
  }

  return (
    <Card className="print-container">
      <div className={styles.headerContainer}>
        <div>
          <Link to={fromAuditLogs ? "/audit-logs" : "/inspections"}>
            <Button
              icon={<ArrowLeftOutlined />}
              type="default"
              className="no-print"
            >
              {fromAuditLogs ? "Back to Audit Logs" : "Back to List"}
            </Button>
          </Link>
          <Title
            level={4}
            className={styles.headerTitle}
            style={{ marginTop: 16 }}
          >
            {inspection.title}
          </Title>
          <Text type="secondary">
            {inspection.vessel?.name} -{" "}
            {inspection.inspectionDate
              ? dayjs(inspection.inspectionDate).format("DD/MM/YYYY")
              : "No date"}
          </Text>
        </div>
        <Space className="no-print">
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
            Export PDF
          </Button>
          <Link to={`/inspections/edit/${inspection.id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
        </Space>
      </div>

      <div className={styles.viewSection}>
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="Vessel">
            {inspection.vessel?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Inspected By">
            {inspection.inspectedBy || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Inspection Date">
            {inspection.inspectionDate
              ? dayjs(inspection.inspectionDate).format("DD/MM/YYYY")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ship's File No">
            {inspection.shipFileNo || inspection.vessel?.shipFileNo || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Office File No">
            {inspection.officeFileNo || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Revision No">
            {inspection.revisionNo || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Form No">
            {inspection.formNo || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {inspection.createdBy?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(inspection.createdAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div className={styles.viewSection}>
        <Title level={5}>
          Deficiency Entries ({inspection.entries?.length || 0})
        </Title>
        <Table
          columns={columns}
          dataSource={inspection.entries || []}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
          size="small"
          className={styles.viewTable}
        />
      </div>

      {/* Modal for expanded text view */}
      <Modal
        title={expandedTextModal.title}
        open={expandedTextModal.visible}
        onCancel={() =>
          setExpandedTextModal({ visible: false, title: "", content: "" })
        }
        footer={[
          <Button
            key="close"
            onClick={() =>
              setExpandedTextModal({ visible: false, title: "", content: "" })
            }
          >
            Close
          </Button>
        ]}
        width={600}
        className={styles.textViewModal}
      >
        <div className={styles.textViewModalContent}>
          {expandedTextModal.content}
        </div>
      </Modal>
    </Card>
  );
};
