import { useCallback, useEffect, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { DropResult } from "react-beautiful-dnd";
import _ from "lodash";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import BoltIcon from "@mui/icons-material/Bolt";
import debug from "debug";
import { AxiosError } from "axios";
import HelpIcon from "@mui/icons-material/Help";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { useMountedState } from "react-use";
import { CommandItem, JsonCommandItem } from "./commandTypes";
import CommandListView from "./DraggableCommands/CommandListView";
import {
  reorder,
  fromCommandDTOToCommandItem,
  fromCommandDTOToJsonCommand,
  exportJson,
  isTaskFinal,
  updateCommandResults,
} from "./utils";
import {
  deleteCommand,
  getCommand,
  getCommands,
  moveCommand,
  updateCommand,
  replaceCommands,
  applyCommands,
  getStudyTask,
  exportCommandsMatrices,
} from "../../../../../services/api/variant";
import {
  WSEvent,
  WSMessage,
  CommandResultDTO,
  TaskEventPayload,
  TaskStatus,
} from "../../../../../common/types";
import CommandImportButton from "./DraggableCommands/CommandImportButton";
import { getTask } from "../../../../../services/api/tasks";
import { Body, EditHeader, Header, headerIconStyle, Root } from "./style";
import SimpleLoader from "../../../../common/loaders/SimpleLoader";
import useEnqueueErrorSnackbar from "../../../../../hooks/useEnqueueErrorSnackbar";
import {
  addWsMessageListener,
  sendWsSubscribeMessage,
  WsChannel,
} from "../../../../../services/webSockets";
import ConfirmationDialog from "../../../../common/dialogs/ConfirmationDialog";
import CheckBoxFE from "../../../../common/fieldEditors/CheckBoxFE";
import SimpleContent from "../../../../common/page/SimpleContent";

const logError = debug("antares:variantedition:error");

interface Props {
  studyId: string;
}

function EditionView(props: Props) {
  const [t] = useTranslation();
  const isMounted = useMountedState();
  const { enqueueSnackbar } = useSnackbar();
  const enqueueErrorSnackbar = useEnqueueErrorSnackbar();
  const { studyId } = props;
  const [openClearCommandsDialog, setOpenClearCommandsDialog] = useState(false);
  const [openDeleteCommandDialog, setOpenDeleteCommandDialog] = useState(-1);
  const [openExportCommandsDialog, setOpenExportCommandsDialog] =
    useState(false);
  const [exportMatrices, setExportMatrices] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(false);
  const [generationTaskId, setGenerationTaskId] = useState<string>();
  const [currentCommandGenerationIndex, setCurrentCommandGenerationIndex] =
    useState<number>(-1);
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);
  const [commands, setCommands] = useState<Array<CommandItem>>([]);
  const [loaded, setLoaded] = useState(false);
  const taskFetchPeriod = 3000;
  // eslint-disable-next-line no-undef
  const taskTimeoutId = useRef<NodeJS.Timeout>();

  const onDragEnd = async ({ destination, source }: DropResult) => {
    // dropped outside the list or same place
    if (!destination || source.index === destination.index) {
      return;
    }
    const oldCommands = commands.concat([]);
    try {
      const elm = commands[source.index];
      const newItems = reorder(commands, source.index, destination.index);
      setCommands(newItems.map((item) => ({ ...item, results: undefined })));
      await moveCommand(studyId, elm.id as string, destination.index);
      enqueueSnackbar(t("variants.success.commandMoved"), {
        variant: "success",
      });
    } catch (e) {
      setCommands(oldCommands);
      enqueueErrorSnackbar(t("variants.error.moveCommand"), e as AxiosError);
    }
  };

  const onSave = async (index: number) => {
    try {
      const elm = commands[index];
      if (elm.updated) {
        await updateCommand(studyId, elm.id as string, elm);
        let tmpCommand: Array<CommandItem> = [];
        tmpCommand = tmpCommand.concat(commands);
        tmpCommand[index].updated = false;
        setCommands(tmpCommand);
        enqueueSnackbar(t("variants.success.save"), {
          variant: "success",
        });
      }
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.commandUpdated"), e as AxiosError);
    }
  };

  const onDelete = async (index: number) => {
    setOpenDeleteCommandDialog(index);
  };

  const onArgsUpdate = (index: number, args: object) => {
    let tmpCommand: Array<CommandItem> = [];
    tmpCommand = tmpCommand.concat(commands);
    tmpCommand[index].args = { ...args };
    tmpCommand[index].updated = true;
    setCommands(tmpCommand);
  };

  const onCommandImport = async (index: number, json: object) => {
    try {
      let tmpCommand: Array<CommandItem> = [];
      tmpCommand = tmpCommand.concat(commands);
      const elm = tmpCommand[index];
      // eslint-disable-next-line dot-notation
      elm.args = { ...json };
      elm.updated = false;
      await updateCommand(studyId, elm.id as string, elm);
      setCommands(tmpCommand);
      enqueueSnackbar(t("variants.success.import"), {
        variant: "success",
      });
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.import"), e as AxiosError);
    }
  };

  const onCommandExport = async (index: number) => {
    try {
      const elm = await getCommand(studyId, commands[index].id as string);
      exportJson(
        { action: elm.action, args: elm.args },
        `${elm.id}_command.json`,
      );
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.export"), e as AxiosError);
    }
  };

  const onGlobalExport = async () => {
    try {
      const items = await getCommands(studyId);
      if (exportMatrices) {
        await exportCommandsMatrices(studyId);
      }
      exportJson(
        fromCommandDTOToJsonCommand(items),
        `${studyId}_commands.json`,
      );
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.export"), e as AxiosError);
    } finally {
      if (isMounted()) {
        setExportMatrices(false);
        setOpenExportCommandsDialog(false);
      }
    }
  };

  const onGlobalImport = async (json: object) => {
    setLoaded(false);
    try {
      const globalJson: Array<JsonCommandItem> = json as Array<JsonCommandItem>;
      await replaceCommands(studyId, globalJson);

      const dtoItems = await getCommands(studyId);
      setCommands(fromCommandDTOToCommandItem(dtoItems));
      enqueueSnackbar(t("variants.success.import"), {
        variant: "success",
      });
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.import"), e as AxiosError);
    } finally {
      setLoaded(true);
    }
  };

  const onGeneration = async () => {
    try {
      // Get commands
      const dtoItems = await getCommands(studyId);
      setCommands(fromCommandDTOToCommandItem(dtoItems));
      setCurrentCommandGenerationIndex(0);
      // Launch generation task
      const res = await applyCommands(studyId);
      setGenerationTaskId(res);
      setGenerationStatus(true);
      enqueueSnackbar(t("variants.success.launchGeneration"), {
        variant: "success",
      });
    } catch (e) {
      enqueueErrorSnackbar(
        t("variants.error.launchGeneration"),
        e as AxiosError,
      );
    }
  };

  const onExpanded = (index: number, value: boolean) => {
    if (value) {
      setExpandedIndex(index);
    } else {
      setExpandedIndex(-1);
    }
  };

  const doUpdateCommandResults = useCallback(
    (commandResults: Array<CommandResultDTO>) => {
      const res = updateCommandResults(studyId, commands, commandResults);
      setCurrentCommandGenerationIndex(res.index);
      setCommands(res.commands);
    },
    [studyId, commands],
  );

  const listen = useCallback(
    (ev: WSMessage) => {
      const taskStart = (taskPayload: TaskEventPayload) => {
        if (taskPayload.message === studyId) {
          if (commands.length > 0) {
            setCurrentCommandGenerationIndex(0);
          }
          setGenerationStatus(true);
        }
      };

      const taskEnd = (taskPayload: TaskEventPayload, event: WSEvent) => {
        if (taskPayload.message === studyId) {
          setCurrentCommandGenerationIndex(-1);
          if (event === WSEvent.TASK_COMPLETED) {
            enqueueSnackbar(t("variants.taskCompleted"), {
              variant: "success",
            });
          } else {
            enqueueSnackbar(t("variants.error.taskFailed"), {
              variant: "error",
            });
          }
          setGenerationStatus(false);
          setGenerationTaskId(undefined);
        }
      };

      switch (ev.type) {
        case WSEvent.STUDY_VARIANT_GENERATION_COMMAND_RESULT:
          doUpdateCommandResults([ev.payload as CommandResultDTO]);
          break;
        case WSEvent.TASK_ADDED:
          taskStart(ev.payload as TaskEventPayload);
          break;
        case WSEvent.TASK_COMPLETED:
        case WSEvent.TASK_FAILED:
          taskEnd(ev.payload as TaskEventPayload, ev.type);
          break;
        default:
          break;
      }
    },
    [commands.length, doUpdateCommandResults, enqueueSnackbar, studyId, t],
  );

  const fetchTask = useCallback(async () => {
    if (generationStatus && generationTaskId) {
      const tmpTask = await getTask(generationTaskId);
      if (isTaskFinal(tmpTask)) {
        setGenerationStatus(false);
        setGenerationTaskId(undefined);
      }
    }
  }, [generationStatus, generationTaskId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFailureNotification = useCallback(
    _.debounce(
      () => {
        enqueueSnackbar(t("variants.error.taskFailed"), {
          variant: "error",
        });
      },
      1000,
      { trailing: false, leading: true },
    ),
    [enqueueSnackbar, t],
  );

  useEffect(() => {
    const commandGenerationChannel = WsChannel.StudyGeneration + studyId;
    const unsubscribe = sendWsSubscribeMessage(commandGenerationChannel);

    const init = async () => {
      let items: Array<CommandItem> = [];
      setLoaded(false);
      try {
        const dtoItems = await getCommands(studyId);
        items = fromCommandDTOToCommandItem(dtoItems);
      } catch (e) {
        logError("Error: ", e);
        enqueueErrorSnackbar(t("variants.error.fetchCommand"), e as AxiosError);
      }

      try {
        const task = await getStudyTask(studyId);

        let currentIndex = -1;
        const isFinal = isTaskFinal(task);

        if (task.logs === undefined || task.logs.length === 0) {
          if (!isFinal) {
            currentIndex = 0;
          } else if (task.status !== TaskStatus.COMPLETED) {
            debouncedFailureNotification();
          }
        } else {
          const res = updateCommandResults(
            studyId,
            items,
            task.logs.map((elm) => JSON.parse(elm.message) as CommandResultDTO),
          );
          items = res.commands;
          currentIndex = res.index;
        }
        if (!isFinal) {
          setGenerationTaskId(task.id);
        }
        setCurrentCommandGenerationIndex(currentIndex);
        setGenerationStatus(!isFinal);
        setCommands(items);
      } catch (error) {
        logError("Error: ", error);
      }
      setCommands(items);
      setLoaded(true);
    };
    init();

    return () => unsubscribe();
  }, [
    commands.length,
    enqueueSnackbar,
    enqueueErrorSnackbar,
    studyId,
    t,
    debouncedFailureNotification,
  ]);

  useEffect(() => {
    return addWsMessageListener(listen);
  }, [listen]);

  useEffect(() => {
    if (generationTaskId) {
      // TODO Maybe WsChannel.StudyGeneration?
      const taskChannel = WsChannel.Task + generationTaskId;
      const unsubscribe = sendWsSubscribeMessage(taskChannel);

      if (taskTimeoutId.current) {
        clearTimeout(taskTimeoutId.current);
      }
      taskTimeoutId.current = setTimeout(fetchTask, taskFetchPeriod);

      return () => unsubscribe();
    }
    return () => {
      if (taskTimeoutId.current) {
        clearTimeout(taskTimeoutId.current);
      }
    };
  }, [fetchTask, generationTaskId]);

  ////////////////////////////////////////////////////////////////
  // Event Handlers
  ////////////////////////////////////////////////////////////////

  const handleClearCommands = async () => {
    setLoaded(false);
    try {
      await replaceCommands(studyId, []);
      const dtoItems = await getCommands(studyId);
      if (isMounted()) {
        setCommands(fromCommandDTOToCommandItem(dtoItems));
      }
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.import"), e as AxiosError);
    } finally {
      if (isMounted()) {
        setLoaded(true);
        setOpenClearCommandsDialog(false);
      }
    }
  };

  const handleDeleteCommand = async () => {
    setOpenDeleteCommandDialog(-1);
    try {
      const index = openDeleteCommandDialog;
      const elm = commands[index];
      await deleteCommand(studyId, elm.id as string);
      setCommands((commandList) =>
        commandList
          .filter((item, idx) => idx !== index)
          .map((item) => ({ ...item, results: undefined })),
      );
      enqueueSnackbar(t("variants.success.delete"), {
        variant: "success",
      });
    } catch (e) {
      enqueueErrorSnackbar(t("variants.error.commandDeleted"), e as AxiosError);
    }
  };

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <Root>
      {!generationStatus ? (
        <Header>
          <Button color="primary" variant="outlined" onClick={onGeneration}>
            <BoltIcon sx={{ mr: 1 }} />
            <Typography>{t("global.generate")}</Typography>
          </Button>
          <EditHeader>
            <Tooltip title={t("variants.commands.import")}>
              <CommandImportButton onImport={onGlobalImport} />
            </Tooltip>
            <Tooltip title={t("variants.commands.export")}>
              <CloudDownloadOutlinedIcon
                sx={{ ...headerIconStyle }}
                onClick={() => setOpenExportCommandsDialog(true)}
              />
            </Tooltip>
            <Tooltip title={t("variants.commands.clear")}>
              <DeleteForeverIcon
                sx={{
                  ...headerIconStyle,
                  color: "error.light",
                  "&:hover": { color: "error.main" },
                }}
                onClick={() => setOpenClearCommandsDialog(true)}
              />
            </Tooltip>
            <a
              href="https://antares-web.readthedocs.io/en/latest/user-guide/2-variant_manager/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <HelpIcon sx={{ ...headerIconStyle }} />
            </a>
          </EditHeader>
        </Header>
      ) : (
        <Header>
          <Typography
            color="primary"
            sx={{
              bgcolor: "action.selected",
              px: 1,
              borderRadius: "shape.borderRadius",
              mx: 3,
            }}
          >
            {t("variants.generationInProgress")}
          </Typography>
        </Header>
      )}
      {loaded && commands.length > 0 ? (
        <Body>
          <CommandListView
            items={commands}
            generationStatus={generationStatus}
            expandedIndex={expandedIndex}
            generationIndex={currentCommandGenerationIndex}
            onDragEnd={onDragEnd}
            onDelete={onDelete}
            onArgsUpdate={onArgsUpdate}
            onSave={onSave}
            onCommandImport={onCommandImport}
            onCommandExport={onCommandExport}
            onExpanded={onExpanded}
          />
        </Body>
      ) : (
        loaded && (
          <Body sx={{ alignItems: "left" }}>
            <Box height="85%">
              <SimpleContent title="variants.error.noCommands" />
            </Box>
          </Body>
        )
      )}
      {!loaded && (
        <Body>
          <SimpleLoader color="" />
        </Body>
      )}
      {openClearCommandsDialog && (
        <ConfirmationDialog
          open={openClearCommandsDialog}
          onConfirm={handleClearCommands}
          onCancel={() => setOpenClearCommandsDialog(false)}
        >
          {t("variants.commands.question.deleteAll")}
        </ConfirmationDialog>
      )}
      {openDeleteCommandDialog > -1 && (
        <ConfirmationDialog
          open
          onConfirm={handleDeleteCommand}
          onCancel={() => setOpenDeleteCommandDialog(-1)}
        >
          {t("variants.commands.question.delete")}
        </ConfirmationDialog>
      )}
      {openExportCommandsDialog && (
        <ConfirmationDialog
          title={t("variants.commands.export")}
          open={openExportCommandsDialog}
          onConfirm={onGlobalExport}
          onCancel={() => setOpenExportCommandsDialog(false)}
        >
          <CheckBoxFE
            value={exportMatrices}
            label={t("variants.commands.exportMatrices")}
            onChange={() => setExportMatrices(!exportMatrices)}
          />
        </ConfirmationDialog>
      )}
    </Root>
  );
}

export default EditionView;
