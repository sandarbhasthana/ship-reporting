/**
 * Custom Header Component
 * Includes branding and theme toggle
 */

import { Typography, Button, Dropdown } from "antd";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

const { Text } = Typography;

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export function Header() {
  const { data: user } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  const menuItems = [
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: () => logout()
    }
  ];

  return (
    <div className={styles.headerContainer}>
      <ThemeToggle />

      {user && (
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" className={styles.userButton}>
            <UserOutlined />
            <Text className={styles.userName} ellipsis>
              {user.name || user.email}
            </Text>
          </Button>
        </Dropdown>
      )}
    </div>
  );
}
