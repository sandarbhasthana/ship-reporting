import { Card, Col, Row, Statistic } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export const DashboardPage = () => {
  return (
    <div className="p-5">
      <h1>Dashboard</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Inspections"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={0}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={0}
              prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Vessels"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

