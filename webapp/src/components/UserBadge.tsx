import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useHistory } from 'react-router';
import { Button, Popover, ButtonBase, makeStyles, Theme, createStyles } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { AppState } from '../App/reducers';
import { logoutAction } from '../ducks/auth';
import { getUser } from '../services/api/user';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    content: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      marginTop: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
    },
    usericon: {
      color: theme.palette.primary.main,
    },
    username: {
      color: theme.palette.primary.main,
      fontSize: '1.2em',
      margin: theme.spacing(1),
    },
    logoutbutton: {
      margin: theme.spacing(1),
    },
  }));

const mapState = (state: AppState) => ({
  user: state.auth.user,
});

const mapDispatch = ({
  logout: logoutAction,
});

const connector = connect(mapState, mapDispatch);
type ReduxProps = ConnectedProps<typeof connector>;
type PropTypes = ReduxProps;

const UserBadge = (props: PropTypes) => {
  const { user, logout } = props;
  const [t] = useTranslation();
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [userName, setUserName] = useState<string>('');
  const history = useHistory();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const settings = () => {
    // On renvoi vers la route /usersettings
    history.push('/usersettings');

    // On ferme la fenêtre de menu
    handleClose();
  };

  useEffect(() => {
    const init = async () => {
      if (user) {
        const respUser = await getUser(user.id);
        setUserName(respUser.name);
      }
    };
    init();
    return () => {
      setUserName('');
    };
  }, [user]);

  const open = Boolean(anchorEl);

  if (!user) {
    return <div />;
  }

  return (
    <>
      <ButtonBase onClick={handleClick}>
        <FontAwesomeIcon size="2x" icon="user" />
      </ButtonBase>
      <Popover
        id="user-badge-content"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div className={classes.root}>
          <div className={classes.content}>
            <div className={classes.header}>
              <FontAwesomeIcon className={classes.usericon} icon="user-circle" size="3x" />
              <div className={classes.username}>{userName}</div>
            </div>
          </div>
          <Button className={classes.logoutbutton} onClick={settings} variant="contained" color="primary">
            {t('main:settings')}
          </Button>
          <Button className={classes.logoutbutton} onClick={logout} variant="contained" color="primary">
            {t('main:logout')}
          </Button>
        </div>
      </Popover>
    </>
  );
};

export default connector(UserBadge);
