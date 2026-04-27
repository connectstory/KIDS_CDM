import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { Helmet } from "react-helmet";
import ContentAccount from "./components/ContentAccount";
import ContentEmailSetting from "./components/ContentEmailSetting";

export default function ResearchSettingView() {
  const [settingTabIndex, setSettingTabIndex] = useState(0);

  const handleSettingTabIndexChange = (event: React.SyntheticEvent, newValue: number) => {
    setSettingTabIndex(newValue);
  };

  return (
    <Box>
      <Helmet>
        <title>
          {settingTabIndex === 0 ? `CDM - VDI 계정 현황` : `CDM - 연구과제 담당자 설정`}
        </title>
      </Helmet>
      <Box>
        <Box className="tab_container">
          <Tabs value={settingTabIndex} onChange={handleSettingTabIndexChange}>
            <Tab label="VDI 계정 현황" />
            <Tab label="담당자 설정" />
          </Tabs>
        </Box>

        <Box className="tab_content">
          {settingTabIndex === 0 && <ContentAccount />}
          {settingTabIndex === 1 && <ContentEmailSetting />}
        </Box>
      </Box>
    </Box>
  );
}
