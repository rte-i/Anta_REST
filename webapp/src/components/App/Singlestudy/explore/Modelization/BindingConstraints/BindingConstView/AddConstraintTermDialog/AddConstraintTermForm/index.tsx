import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { useTranslation } from "react-i18next";
import { AllClustersAndLinks } from "../../../../../../../../../common/types";
import OptionsList from "./OptionsList";
import NumberFE from "../../../../../../../../common/fieldEditors/NumberFE";
import { useFormContextPlus } from "../../../../../../../../common/Form";
import { BindingConstFields, ConstraintTerm } from "../../utils";
import ConstraintElement from "../../constraintviews/ConstraintElement";
import OffsetInput from "../../constraintviews/OffsetInput";

interface Props {
  options: AllClustersAndLinks;
  constraintTerms: BindingConstFields["constraints"];
}

export default function AddConstraintTermForm(props: Props) {
  const { options, constraintTerms } = props;
  const { control, watch, unregister, setValue } =
    useFormContextPlus<ConstraintTerm>();

  const [t] = useTranslation();
  const [isLink, setIsLink] = useState(true);
  const [isOffset, setIsOffset] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          padding: 0,
          alignItems: "center",
        }}
      >
        <ConstraintElement
          title="Weight"
          isLink={isLink}
          onToggleType={() => setIsLink((value) => !value)}
          left={
            <NumberFE
              name="weight"
              label={t("study.modelization.bindingConst.weight")}
              variant="filled"
              control={control}
              rules={{
                required: t("form.field.required") as string,
              }}
            />
          }
          right={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <OptionsList
                isLink={isLink}
                list={options}
                constraintTerms={constraintTerms}
                control={control}
                watch={watch}
                setValue={setValue}
                unregister={unregister}
              />
            </Box>
          }
        />
        {isOffset ? (
          <>
            <Typography sx={{ mx: 1 }}>x</Typography>
            <ConstraintElement
              title="Offset"
              operator="+"
              left={<Typography>t</Typography>}
              right={
                <OffsetInput onRemove={() => setIsOffset(false)}>
                  <NumberFE
                    name="offset"
                    label={t("study.modelization.bindingConst.offset")}
                    variant="filled"
                    control={control}
                    rules={{
                      required: t("form.field.required") as string,
                    }}
                  />
                </OffsetInput>
              }
            />
          </>
        ) : (
          <Button
            variant="text"
            color="secondary"
            startIcon={<AddCircleOutlineRoundedIcon />}
            sx={{ mx: 1 }}
            onClick={() => setIsOffset(true)}
          >
            {t("study.modelization.bindingConst.offset")}
          </Button>
        )}
      </Box>
    </Box>
  );
}
