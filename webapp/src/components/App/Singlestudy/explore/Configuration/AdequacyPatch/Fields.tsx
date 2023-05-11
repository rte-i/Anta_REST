import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import NumberFE from "../../../../../common/fieldEditors/NumberFE";
import SelectFE from "../../../../../common/fieldEditors/SelectFE";
import SwitchFE from "../../../../../common/fieldEditors/SwitchFE";
import Fieldset from "../../../../../common/Fieldset";
import { useFormContextPlus } from "../../../../../common/Form";
import { AdequacyPatchFormFields, PRICE_TAKING_ORDER_OPTIONS } from "./utils";
import { StudyMetadata } from "../../../../../../common/types";

function Fields() {
  const { t } = useTranslation();
  const { control } = useFormContextPlus<AdequacyPatchFormFields>();
  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const studyVersion = Number(study.version);

  return (
    <Box>
      <Fieldset
        legend={t("study.configuration.adequacyPatch.legend.general")}
        fullFieldWidth
      >
        <SwitchFE
          label={t("study.configuration.adequacyPatch.enableAdequacyPatch")}
          name="enableAdequacyPatch"
          control={control}
        />
      </Fieldset>
      <Fieldset
        legend={t("study.configuration.adequacyPatch.legend.localMatchingRule")}
        fullFieldWidth
      >
        <SwitchFE
          label={t(
            "study.configuration.adequacyPatch.ntcFromPhysicalAreasOutToPhysicalAreasInAdequacyPatch"
          )}
          name="ntcFromPhysicalAreasOutToPhysicalAreasInAdequacyPatch"
          control={control}
        />
        <SwitchFE
          label={t(
            "study.configuration.adequacyPatch.ntcBetweenPhysicalAreasOutAdequacyPatch"
          )}
          name="ntcBetweenPhysicalAreasOutAdequacyPatch"
          control={control}
        />
      </Fieldset>
      {studyVersion >= 850 && (
        <>
          <Fieldset
            legend={t(
              "study.configuration.adequacyPatch.legend.curtailmentSharing"
            )}
          >
            <SelectFE
              label={t("study.configuration.adequacyPatch.priceTakingOrder")}
              options={PRICE_TAKING_ORDER_OPTIONS}
              name="priceTakingOrder"
              control={control}
            />
            <SwitchFE
              label={t(
                "study.configuration.adequacyPatch.includeHurdleCostCsr"
              )}
              name="includeHurdleCostCsr"
              control={control}
            />
          </Fieldset>

          <Fieldset
            legend={t("study.configuration.adequacyPatch.legend.advanced")}
            fieldWidth={390}
          >
            <NumberFE
              label={t(
                "study.configuration.adequacyPatch.thresholdInitiateCurtailmentSharingRule"
              )}
              name="thresholdInitiateCurtailmentSharingRule"
              control={control}
              rules={{
                min: {
                  value: 0,
                  message: t("form.field.minValue", [0]),
                },
              }}
            />
            <NumberFE
              label={t(
                "study.configuration.adequacyPatch.thresholdDisplayLocalMatchingRuleViolations"
              )}
              name="thresholdDisplayLocalMatchingRuleViolations"
              control={control}
              rules={{
                min: {
                  value: 0,
                  message: t("form.field.minValue", [0]),
                },
              }}
            />
            <NumberFE
              label={t(
                "study.configuration.adequacyPatch.thresholdCsrVariableBoundsRelaxation"
              )}
              name="thresholdCsrVariableBoundsRelaxation"
              control={control}
              rules={{
                min: {
                  value: 0,
                  message: t("form.field.minValue", [0]),
                },
              }}
            />
            <Fieldset.Break />
            <SwitchFE
              label={t(
                "study.configuration.adequacyPatch.checkCsrCostFunction"
              )}
              name="checkCsrCostFunction"
              control={control}
            />
          </Fieldset>
        </>
      )}
    </Box>
  );
}

export default Fields;
