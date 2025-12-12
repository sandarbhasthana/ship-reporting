/**
 * Custom Header Component
 * Includes branding and theme toggle
 */

import { Typography, Button, Dropdown, Avatar } from "antd";
import { useGetIdentity, useLogout, useApiUrl } from "@refinedev/core";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

const { Text } = Typography;

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
  profileImageUrl?: string;
}

export function Header() {
  const { data: user } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const apiUrl = useApiUrl();
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();

  // Fetch user profile to get profile image
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfileImageUrl(data.profileImage);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user, apiUrl]);

  const menuItems = [
    {
      key: "settings",
      label: "Settings",
      icon: <SettingOutlined />,
      onClick: () => navigate("/settings/profile")
    },
    {
      type: "divider" as const
    },
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
            <Avatar
              size="small"
              icon={<UserOutlined />}
              src={profileImageUrl}
              className={styles.userAvatar}
            />
            <Text className={styles.userName} ellipsis>
              {user.name || user.email}
            </Text>
          </Button>
        </Dropdown>
      )}
    </div>
  );
}
