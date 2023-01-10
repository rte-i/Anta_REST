import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { Delete, Edit } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { useRef, useState } from "react";
import FormDialog from "../../../../../../../common/dialogs/FormDialog";
import StringFE from "../../../../../../../common/fieldEditors/StringFE";
import {
  SubmitHandlerPlus,
  UseFormReturnPlus,
} from "../../../../../../../common/Form/types";
import { StudyMetadata } from "../../../../../../../../common/types";
import useAppSelector from "../../../../../../../../redux/hooks/useAppSelector";
import { getStudyMapLayers } from "../../../../../../../../redux/selectors";
import SelectFE from "../../../../../../../common/fieldEditors/SelectFE";
import Fieldset from "../../../../../../../common/Fieldset";
import ConfirmationDialog from "../../../../../../../common/dialogs/ConfirmationDialog";
import {
  deleteStudyMapLayer,
  updateStudyMapLayer,
} from "../../../../../../../../redux/ducks/studyMaps";
import useAppDispatch from "../../../../../../../../redux/hooks/useAppDispatch";

interface Props {
  open: boolean;
  onClose: () => void;
}

function EditLayerDialog(props: Props) {
  const { open, onClose } = props;
  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const [t] = useTranslation();
  const dispatch = useAppDispatch();
  const layers = useAppSelector(getStudyMapLayers);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

  const defaultValues = {
    name: "",
    layerId: -1,
  };

  const apiRef = useRef<UseFormReturnPlus<typeof defaultValues>>();

  const layersOptions = Object.values(layers).map(({ name, id }) => ({
    label: name,
    value: id,
  }));

  ////////////////////////////////////////////////////////////////
  // Event Handlers
  ////////////////////////////////////////////////////////////////

  const handleSubmit = async (
    data: SubmitHandlerPlus<typeof defaultValues>
  ) => {
    const { layerId, name } = data.values;
    if (layerId && name) {
      dispatch(updateStudyMapLayer({ studyId: study.id, layerId, name }));
    }
    onClose();
  };

  const handleDelete = async (layerId: number) => {
    if (layerId) {
      dispatch(deleteStudyMapLayer({ studyId: study.id, layerId }));
    }
    setOpenConfirmationModal(false);
    onClose();
  };

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <FormDialog
      title={t("Edit Layers")}
      titleIcon={Edit}
      open={open}
      onCancel={onClose}
      onSubmit={handleSubmit}
      apiRef={apiRef}
      config={{
        defaultValues,
      }}
    >
      {({ control, setValue, getValues }) => (
        <Fieldset fullFieldWidth>
          <SelectFE
            name="layerId"
            label={t("Layers")}
            variant="filled"
            options={layersOptions}
            control={control}
            onChange={(e) =>
              setValue("name", layers[Number(e.target.value)].name)
            }
          />
          <StringFE
            label={t("global.name")}
            name="name"
            control={control}
            fullWidth
            rules={{
              required: true,
              validate: (val) => val.trim().length > 0,
            }}
            sx={{ mx: 0 }}
          />
          <Button
            color="error"
            variant="outlined"
            size="small"
            startIcon={<Delete />}
            disabled={getValues("layerId") === -1}
            onClick={() => setOpenConfirmationModal(true)}
            sx={{ mr: 1 }}
          >
            {t("Delete Layer")}
          </Button>
          {openConfirmationModal && (
            <ConfirmationDialog
              onCancel={() => setOpenConfirmationModal(false)}
              onConfirm={(): void => {
                handleDelete(getValues("layerId"));
              }}
              alert="warning"
              open
            >
              <Typography sx={{ p: 3 }}>{t("Delete layer ?")}</Typography>
            </ConfirmationDialog>
          )}
        </Fieldset>
      )}
    </FormDialog>
  );
}

export default EditLayerDialog;
