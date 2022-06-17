import { ReactNode, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { SubmitHandler, useForm } from "react-hook-form";
import { login } from "../../redux/ducks/auth";
import logo from "../../assets/logo.png";
import topRightBackground from "../../assets/top-right-background.png";
import GlobalPageLoadingError from "../common/loaders/GlobalPageLoadingError";
import AppLoader from "../common/loaders/AppLoader";
import { needAuth } from "../../services/api/auth";
import { getAuthUser } from "../../redux/selectors";
import usePromiseWithSnackbarError from "../../hooks/usePromiseWithSnackbarError";
import useAppSelector from "../../redux/hooks/useAppSelector";
import useAppDispatch from "../../redux/hooks/useAppDispatch";
import storage, { StorageKey } from "../../services/utils/localStorage";

interface Inputs {
  username: string;
  password: string;
}

interface Props {
  children: ReactNode;
}

function LoginWrapper(props: Props) {
  const { children } = props;
  const { register, handleSubmit, reset, formState } = useForm<Inputs>();
  const [loginError, setLoginError] = useState("");
  const { t } = useTranslation();
  const user = useAppSelector(getAuthUser);
  const dispatch = useAppDispatch();

  const {
    data: canDisplayApp,
    isLoading,
    isRejected,
  } = usePromiseWithSnackbarError(
    async () => {
      if (user) {
        return true;
      }
      if (!(await needAuth())) {
        await dispatch(login());
        return true;
      }
      const userFromStorage = storage.getItem(StorageKey.AuthUser);
      if (userFromStorage) {
        await dispatch(login(userFromStorage));
        return true;
      }
      return false;
    },
    {
      errorMessage: t("login.error"),
      resetDataOnReload: false,
      deps: [user],
    }
  );

  ////////////////////////////////////////////////////////////////
  // Event Handlers
  ////////////////////////////////////////////////////////////////

  const handleLoginSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoginError("");
    setTimeout(async () => {
      try {
        await dispatch(login(data)).unwrap();
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLoginError((e as any).data?.message || t("login.error"));
      } finally {
        reset({ username: data.username });
      }
    }, 500);
  };

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  if (isLoading) {
    return <AppLoader />;
  }

  if (isRejected) {
    return <GlobalPageLoadingError />;
  }

  if (canDisplayApp) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return (
    <Box
      display="flex"
      height="100vh"
      sx={{
        background:
          "radial-gradient(ellipse at top right, #190520 0%, #190520 30%, #222333 100%)",
      }}
    >
      <Box
        position="absolute"
        top="0px"
        right="0px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        flexWrap="nowrap"
        boxSizing="border-box"
      >
        <img src={topRightBackground} alt="logo" style={{ height: "auto" }} />
      </Box>
      <Box
        flexGrow={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={999}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          flexWrap="nowrap"
          boxSizing="border-box"
        >
          <Box
            display="flex"
            width="70%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
            flexWrap="nowrap"
            boxSizing="border-box"
          >
            <img src={logo} alt="logo" style={{ height: "96px" }} />
            <Typography variant="h4" component="h4" color="primary" my={2}>
              Antares Web
            </Typography>
          </Box>
          <Box width="70%" my={2}>
            <form
              style={{ marginTop: "16px" }}
              onSubmit={handleSubmit(handleLoginSubmit)}
            >
              <TextField
                label="NNI"
                variant="filled"
                fullWidth
                inputProps={{ ...register("username", { required: true }) }}
                sx={{ my: 3 }}
                required
              />
              <TextField
                variant="filled"
                required
                type="password"
                label={t("global.password")}
                fullWidth
                inputProps={{
                  autoComplete: "current-password",
                  ...register("password", { required: true }),
                }}
              />
              {loginError && (
                <Box
                  mt={2}
                  color="error.main"
                  mb={4}
                  sx={{ fontSize: "0.9rem" }}
                >
                  {loginError}
                </Box>
              )}
              <Box display="flex" justifyContent="center" mt={6}>
                <Button
                  disabled={formState.isSubmitting}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {formState.isSubmitting && (
                    <CircularProgress size="1em" sx={{ mr: "1em" }} />
                  )}
                  {t("global.connexion")}
                </Button>
              </Box>
            </form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginWrapper;