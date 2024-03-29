import React from "react";
import { Form } from "@ant-design/compatible";
import { FormComponentProps } from "@ant-design/compatible/lib/form";
import { ConnectedComponentClass } from "@ant-design/compatible/lib/form/interface";
import {
  FormLayout,
  WrappedFormInternalProps,
} from "@ant-design/compatible/lib/form/Form";
import moment from "moment";
import { AbstractGeneralFormElement } from "@next-libs/forms";
import { FormAlignment } from "../interfaces";

const AlignmentJustifyContentValueMap: Record<FormAlignment, string> = {
  [FormAlignment.Left]: "flex-start",
  [FormAlignment.Right]: "flex-end",
  [FormAlignment.Center]: "center",
};

interface LegacyGeneralFormProps extends FormComponentProps {
  formElement: AbstractGeneralFormElement;
  layout?: FormLayout;
  values?: Record<string, any>;
  valueTypes?: Record<string, string>;
  maxWidthLimited?: boolean;
  alignment?: FormAlignment;
}

export function LegacyGeneralForm(
  props: LegacyGeneralFormProps
): React.ReactElement {
  const { form, formElement, layout, maxWidthLimited, alignment } = props;
  formElement.formUtils = form;

  return (
    <div
      className="form-container"
      style={{ justifyContent: AlignmentJustifyContentValueMap[alignment] }}
    >
      <Form
        layout={layout}
        style={maxWidthLimited ? { maxWidth: 1332 } : undefined}
      >
        <slot id="itemsSlot" name="items" />
      </Form>
    </div>
  );
}

export type ConnectedForm = ConnectedComponentClass<
  typeof LegacyGeneralForm,
  Omit<LegacyGeneralFormProps, keyof WrappedFormInternalProps>
>;

export const GeneralFormGen = (name?: string): ConnectedForm => {
  return Form.create<LegacyGeneralFormProps>({
    name,
    mapPropsToFields(props: LegacyGeneralFormProps) {
      return props.values
        ? Object.entries(props.values).reduce<Record<string, any>>(
            (acc, [key, value]) => {
              const valueType = props.valueTypes && props.valueTypes[key];
              if (typeof valueType === "string") {
                // The value of date-picker must be a moment object.
                const matches = valueType.match(/^moment(?:\|(.+))?$/);
                if (matches) {
                  value = moment(value, matches[1]);
                }
              }

              acc[key] = Form.createFormField({
                value,
              });
              return acc;
            },
            {}
          )
        : {};
    },
  })(LegacyGeneralForm);
};

export const GeneralForm = GeneralFormGen();
