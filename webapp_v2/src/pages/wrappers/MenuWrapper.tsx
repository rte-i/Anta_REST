/* eslint-disable react/jsx-props-no-spreading */
import React, { PropsWithChildren } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';

import ApiIcon from '@mui/icons-material/Api';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ReadMoreOutlinedIcon from '@mui/icons-material/ReadMoreOutlined';

import { SvgIconProps, useTheme } from '@mui/material';
import logo from '../../assets/logo.png';
import { AppState } from '../../store/reducers';
import { setMenuExtensionStatusAction } from '../../store/ui';
import { NavDrawer, NavListItem, NavExternalLink, NavInternalLink, NavListItemText, NavListItemIcon } from '../../components/MenuWrapperComponents';

interface MenuItem {
  id: string;
  link: string;
  newTab?: boolean;
  icon: React.FunctionComponent<SvgIconProps>;
}

const mapState = (state: AppState) => ({
  extended: state.ui.menuExtended,
});

const mapDispatch = ({
  setExtended: setMenuExtensionStatusAction,
});

const connector = connect(mapState, mapDispatch);
type ReduxProps = ConnectedProps<typeof connector>;
type PropTypes = ReduxProps;

function MenuWrapper(props: PropsWithChildren<PropTypes>) {
  const { children, extended, setExtended } = props;
  const theme = useTheme();
  const [t] = useTranslation();

  const navigation: Array<MenuItem> = [
    { id: 'studies', link: '/studies', icon: TravelExploreOutlinedIcon },
    { id: 'data', link: '/data', icon: ShowChartOutlinedIcon },
    { id: 'tasks', link: '/tasks', icon: PlaylistAddCheckOutlinedIcon },
    { id: 'api', link: '/api', icon: ApiIcon },
    { id: 'documentation', link: 'https://antares-web.readthedocs.io/en/latest', newTab: true, icon: ClassOutlinedIcon },
    { id: 'github', link: 'https://github.com/AntaresSimulatorTeam/AntaREST', newTab: true, icon: GitHubIcon },
    { id: 'settings', link: '/settings', icon: SettingsOutlinedIcon },
  ];

  const settings = navigation[navigation.length - 1];

  const drawMenuItem = (elm: MenuItem): React.ReactNode => (
    <NavListItem link key={elm.id}>
      {elm.newTab === true ? (
        <NavExternalLink href={elm.link} target="_blank">
          <NavListItemIcon>
            <elm.icon sx={{ color: 'grey.400' }} />
          </NavListItemIcon>
          {extended && <NavListItemText primary={t(`main:${elm.id}`)} />}
        </NavExternalLink>
      ) : (
        <NavInternalLink
          to={elm.link}
          style={({ isActive }) => ({
            background: isActive ? theme.palette.primary.outlinedHoverBackground : undefined })}
        >
          <NavListItemIcon>
            <elm.icon sx={{ color: 'grey.400' }} />
          </NavListItemIcon>
          {extended && <NavListItemText primary={t(`main:${elm.id}`)} />}
        </NavInternalLink>
      )}
    </NavListItem>
  );

  return (
    <Box
      display="flex"
      width="100vw"
      height="100vh"
      overflow="hidden"
      sx={{ background: 'linear-gradient(140deg, rgba(33,32,50,1) 0%, rgba(29,28,48,1) 35%, rgba(27,11,36,1) 100%)' }}
    >
      <CssBaseline />
      <NavDrawer
        extended={extended}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Box display="flex" width="100%" height="100%" justifyContent={extended ? 'flex-start' : 'center'} alignItems="center" flexDirection="row" flexWrap="nowrap" boxSizing="border-box">
            <img src={logo} alt="logo" style={{ height: '32px', marginRight: extended ? '20px' : 0 }} />
            {extended && <Typography style={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>Antares Web</Typography>}
          </Box>
        </Toolbar>
        <Box display="flex" flex={1} justifyContent="space-between" flexDirection="column" sx={{ boxSizing: 'border-box' }}>
          <List>
            {navigation.slice(0, 3).map((elm: MenuItem, index) => (
              drawMenuItem(elm)
            ))}
          </List>
          <List>
            {navigation.slice(3, 6).map((elm: MenuItem, index) => (
              drawMenuItem(elm)
            ))}
          </List>
        </Box>
        <Divider />
        <List>
          {drawMenuItem(settings)}
          <NavListItem>
            <NavListItemIcon>
              <AccountCircleOutlinedIcon sx={{ color: 'grey.400' }} />
            </NavListItemIcon>
            {extended && <NavListItemText primary={t('main:connexion')} />}
          </NavListItem>
          <NavListItem onClick={() => setExtended(!extended)}>
            <NavListItemIcon>
              <ReadMoreOutlinedIcon sx={{ color: 'grey.400' }} />
            </NavListItemIcon>
            {extended && <NavListItemText primary={t('main:hide')} />}
          </NavListItem>
        </List>
      </NavDrawer>
      <Box
        component="main"
        flexGrow={1}
        bgcolor="inherit"
        height="100vh"
        overflow="hidden"
      >
        {children}
      </Box>
    </Box>
  );
}

export default connector(MenuWrapper);