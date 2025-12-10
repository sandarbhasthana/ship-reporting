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
  message
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined
} from "@ant-design/icons";
import { useGetIdentity, useApiUrl } from "@refinedev/core";
import { useParams, Link } from "react-router";
import dayjs from "dayjs";
import styles from "./inspections.module.css";

const { Title, Text } = Typography;

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
  officeSignUser?: { name: string };
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
  const { data: identity } = useGetIdentity<UserIdentity>();
  const isAdmin = identity?.role === "ADMIN";

  const [inspection, setInspection] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Ship Staff columns (first 6 columns)
  const shipStaffColumns = [
    { title: "SR No", dataIndex: "srNo", key: "srNo", width: 60 },
    { title: "Deficiency", dataIndex: "deficiency", key: "deficiency" },
    {
      title: "Master's Cause Analysis",
      dataIndex: "mastersCauseAnalysis",
      key: "mastersCauseAnalysis"
    },
    {
      title: "Corrective Action",
      dataIndex: "correctiveAction",
      key: "correctiveAction"
    },
    {
      title: "Preventive Action",
      dataIndex: "preventiveAction",
      key: "preventiveAction"
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
          key: "companyAnalysis"
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
                {record.officeSignUser?.name ? (
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
          <Link to="/inspections">
            <Button
              icon={<ArrowLeftOutlined />}
              type="default"
              className="no-print"
            >
              Back to List
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
        />
      </div>
    </Card>
  );
};
