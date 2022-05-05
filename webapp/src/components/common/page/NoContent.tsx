import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import LiveHelpRoundedIcon from "@mui/icons-material/LiveHelpRounded";
import { Box, styled } from "@mui/material";

const Root = styled(Box)(({ theme }) => ({
  flex: 1,
  width: "100%",
  height: "100%",
  display: "flex",
  flexFlow: "column nowrap",
  justifyContent: "center",
  alignItems: "center",
  overflowX: "hidden",
  overflowY: "auto",
  position: "relative",
  "&& div": {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

interface Props {
  title?: string;
  icon?: ReactNode;
  callToAction?: ReactNode;
}

function NoContent(props: Props) {
  const { title = "main:noContent", icon, callToAction } = props;
  const [t] = useTranslation();

  return (
    <Root>
      <div>{icon}</div>
      <div>{t(title)}</div>
      <div>{callToAction}</div>
    </Root>
  );
}

NoContent.defaultProps = {
  title: "main:noContent",
  icon: (
    <LiveHelpRoundedIcon
      sx={{ height: "100px", width: "100%", color: "text.primary" }}
    />
  ),
  callToAction: <div />,
};

export default NoContent;