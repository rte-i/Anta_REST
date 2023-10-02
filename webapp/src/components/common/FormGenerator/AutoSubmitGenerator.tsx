/* eslint-disable @typescript-eslint/no-explicit-any */
import * as R from "ramda";
import { useMemo } from "react";
import { FieldValues } from "react-hook-form";
import FormGenerator, {
  IFieldsetType,
  IFormGenerator,
  IGeneratorField,
} from ".";

interface AutoSubmitGeneratorFormProps<T extends FieldValues> {
  jsonTemplate: IFormGenerator<T>;
  saveField: (
    name: IGeneratorField<T>["name"],
    path: string,
    defaultValues: any,
    data: any,
  ) => void;
}
export default function AutoSubmitGeneratorForm<T extends FieldValues>(
  props: AutoSubmitGeneratorFormProps<T>,
) {
  const { saveField, jsonTemplate } = props;

  const formattedJsonTemplate: IFormGenerator<T> = useMemo(
    () =>
      jsonTemplate.map((fieldset) => {
        const { fields, ...otherProps } = fieldset;
        const formattedFields: IFieldsetType<T>["fields"] = fields.map(
          (field) => ({
            ...field,
            rules: (name, path, required, defaultValues) => ({
              onAutoSubmit: R.curry(saveField)(name, path, defaultValues),
              required,
            }),
          }),
        );

        return { fields: formattedFields, ...otherProps };
      }),
    [jsonTemplate, saveField],
  );

  return <FormGenerator jsonTemplate={formattedJsonTemplate} />;
}
