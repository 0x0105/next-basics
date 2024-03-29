import { ContextConf } from "@next-core/brick-types";
import {
  safeDumpFields,
  safeLoadFields,
  computeItemToSubmit,
  ContextItemFormValue,
} from "./utils";

describe("safeDumpFields", () => {
  it.each<[string, Record<string, any>, Record<string, string>]>([
    [
      "should work",
      {
        args: ["args1"],
        if: false,
        transform: {
          value: "<% DATA %>",
        },
      },
      {
        args: "- args1\n",
        if: "false\n",
        transform: "value: <% DATA %>\n",
      },
    ],
  ])("safeDumpFields(%j) should work", async (condition, params, result) => {
    expect(safeDumpFields(params)).toEqual(result);
  });
});

describe("safeLoadFields", () => {
  it.each<[string, Record<string, string>, Record<string, any>]>([
    [
      "should work",
      {
        args: "- args1\n",
        if: "false\n",
        transform: "value: <% DATA %>\n",
      },
      {
        args: ["args1"],
        if: false,
        transform: {
          value: "<% DATA %>",
        },
      },
    ],
    [
      "should delete field with empty value",
      {
        args: "- args1\n",
        if: "false\n",
        transform: undefined,
      },
      {
        args: ["args1"],
        if: false,
      },
    ],
  ])("safeLoadFields(%j) should work", async (condition, params, result) => {
    expect(safeLoadFields(params)).toEqual(result);
  });
});

describe("computeItemToSubmit", () => {
  it.each<[string, ContextItemFormValue, ContextConf]>([
    [
      "should work when type is value",
      {
        type: "value",
        value: "age: 18",
        name: "userInfo",
      },
      {
        name: "userInfo",
        value: {
          age: 18,
        },
      },
    ],
    [
      "should work when type is resolve",
      {
        type: "resolve",
        useProvider: "provider-a",
        if: "<% QUERY.q %>",
        args: "- P-1",
        transform: "value: <% DATA %>\n",
        name: "new",
      },
      {
        name: "new",
        resolve: {
          useProvider: "provider-a",
          if: "<% QUERY.q %>",
          args: ["P-1"],
          transform: {
            value: "<% DATA %>",
          },
        },
      },
    ],
  ])(
    "computeItemToSubmit(%j) should work",
    async (condition, params, result) => {
      expect(computeItemToSubmit(params)).toEqual(result);
    }
  );
});
