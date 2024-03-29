import { getRuntime } from "@next-core/brick-kit";

getRuntime().registerCustomTemplate("forms.tpl-cmdb-object-attr-add", {
  proxy: {
    properties: {
      isProtected: {
        asVariable: true,
      },
      values: {
        ref: "addCmdbObjectAttrForm",
        refProperty: "values",
      },
      submitBtnHidden: {
        ref: "submitButton",
        refProperty: "hidden",
      },
      attrIdInputDisabled: {
        ref: "attrIdInput",
        refProperty: "disabled",
      },
      attrValueDisabled: {
        ref: "attrValue",
        refProperty: "disabled",
      },
      attrOptions: {
        ref: "attrOptions",
        refProperty: "options",
      },
    },
    events: {
      "validate.success": {
        ref: "addCmdbObjectAttrForm",
        refEvent: "validate.success",
      },
      "validate.error": {
        ref: "addCmdbObjectAttrForm",
        refEvent: "validate.error",
      },
    },
    methods: {
      setInitValue: {
        ref: "addCmdbObjectAttrForm",
        refMethod: "setInitValue",
      },
      resetFields: {
        ref: "addCmdbObjectAttrForm",
        refMethod: "resetFields",
      },
      validate: {
        ref: "addCmdbObjectAttrForm",
        refMethod: "validate",
      },
    },
  },
  bricks: [
    {
      brick: "forms.general-form",
      ref: "addCmdbObjectAttrForm",
      events: {
        "validate.success": {
          action: "console.log",
        },
        "validate.error": {
          action: "console.warn",
        },
      },
      slots: {
        items: {
          type: "bricks",
          bricks: [
            {
              brick: "forms.general-input",
              ref: "attrIdInput",
              properties: {
                name: "id",
                label: "属性ID",
                required: true,
                pattern: "^[a-zA-Z][a-zA-Z_0-9]{0,31}$",
                message: {
                  required: "属性ID为必填项",
                  pattern:
                    "请输入1至32个字符，以字母开头，只能包含字母、数字和下划线",
                },
                placeholder: "请输入属性ID",
              },
            },
            {
              brick: "forms.general-input",
              properties: {
                name: "name",
                label: "属性名称",
                required: true,
                message: {
                  required: "属性名称为必填项",
                },
                placeholder: "请输入属性名称",
              },
            },
            {
              brick: "forms.cmdb-object-attr-value",
              ref: "attrValue",
              properties: {
                name: "attrValue",
                label: "值类型",
                required: true,
                message: {
                  required: "请选择值类型",
                },
                placeholder: "请选择值类型",
              },
              events: {
                "forms.cmdb-object-attr-value.change": [
                  {
                    if:
                      "<% EVENT.detail.type === 'str' && ( EVENT.detail.default_type === 'series-number' || EVENT.detail.default_type === 'auto-increment-id') %>",
                    targetRef: "addCmdbObjectAttrForm",
                    method: "setInitValue",
                    args: [{ attrOptions: ["required", "readonly", "unique"] }],
                  },
                  {
                    if:
                      "<% !TPL.isProtected && EVENT.detail.default_type !== 'series-number' &&  EVENT.detail.default_type !== 'auto-increment-id' %>",
                    targetRef: "addCmdbObjectAttrForm",
                    method: "resetFields",
                    args: ["attrOptions"],
                  },
                  {
                    if:
                      "<% !TPL.isProtected && EVENT.detail.type !== 'struct' && EVENT.detail.type !== 'structs' && EVENT.detail.type !== 'enums' && EVENT.detail.type !== 'arr' %>",
                    targetRef: "attrOptions",
                    properties: {
                      options: [
                        {
                          label: "必填",
                          value: "required",
                        },
                        {
                          label: "只读",
                          value: "readonly",
                        },
                        {
                          label: "唯一",
                          value: "unique",
                        },
                      ],
                    },
                  },
                  {
                    if:
                      "<% !TPL.isProtected && (EVENT.detail.type === 'struct' || EVENT.detail.type === 'structs') %>",
                    targetRef: "attrOptions",
                    properties: {
                      options: [
                        {
                          label: "必填",
                          value: "required",
                        },
                        {
                          label: "只读",
                          value: "readonly",
                          disabled: true,
                        },
                        {
                          label: "唯一",
                          value: "unique",
                          disabled: true,
                        },
                      ],
                    },
                  },
                  {
                    if:
                      "<% !TPL.isProtected && (EVENT.detail.type === 'enums' || EVENT.detail.type === 'arr') %>",
                    targetRef: "attrOptions",
                    properties: {
                      options: [
                        {
                          label: "必填",
                          value: "required",
                        },
                        {
                          label: "只读",
                          value: "readonly",
                        },
                        {
                          label: "唯一",
                          value: "unique",
                          disabled: true,
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              brick: "forms.general-input",
              properties: {
                name: "tag",
                label: "属性分类",
                placeholder: "请输入属性分类",
              },
            },
            {
              brick: "forms.general-checkbox",
              ref: "attrOptions",
              properties: {
                name: "attrOptions",
                label: "限制",
                options: [
                  {
                    label: "必填",
                    value: "required",
                  },
                  {
                    label: "只读",
                    value: "readonly",
                  },
                  {
                    label: "唯一",
                    value: "unique",
                  },
                ],
              },
            },
            {
              brick: "forms.general-buttons",
              ref: "submitButton",
              properties: {
                id: "saveBtn",
                submitText: "保存",
              },
            },
          ],
        },
      },
    },
  ],
});
