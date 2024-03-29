import React from "react";
import { shallow, mount } from "enzyme";
import { GeneralCheckbox } from "./GeneralCheckbox";
import { formatOptions } from "@next-libs/forms";
import { Checkbox, Collapse } from "antd";

describe("GeneralCheckbox", () => {
  it("should work", async () => {
    const handleChange = jest.fn();
    const wrapper = mount(
      <GeneralCheckbox
        options={[
          { label: "苹果", value: "Apple" },
          { label: "梨子", value: "Pear" },
        ]}
        onChange={handleChange}
      />
    );
    wrapper.find(Checkbox.Group).invoke("onChange")(["Apple"]);
    await (global as any).flushPromises();
    expect(handleChange).toBeCalledWith(["Apple"]);
  });

  it("should be grid layout", () => {
    const wrapper = mount(
      <GeneralCheckbox
        colSpan={8}
        options={[
          { label: "苹果", value: "Apple" },
          { label: "梨子", value: "Pear" },
        ]}
      />
    );

    expect(wrapper.find("Col").at(1).prop("span")).toEqual(8);
  });

  it("should update value", () => {
    const wrapper = mount(
      <GeneralCheckbox
        options={formatOptions(["good", "better"])}
        value={["good"]}
      />
    );
    expect(wrapper.find(Checkbox.Group).prop("value")).toEqual(["good"]);

    wrapper.setProps({
      value: ["better"],
    });
    wrapper.update();
    expect(wrapper.find(Checkbox.Group).prop("value")).toEqual(["better"]);
  });

  it("should work with isGroup", () => {
    const handleChange = jest.fn();
    const wrapper = mount(
      <GeneralCheckbox
        isGroup={true}
        onChange={handleChange}
        optionGroups={[
          {
            name: "水果",
            key: "fruits",
            options: [
              {
                label: "苹果",
                value: "apple",
              },
              {
                label: "香蕉",
                value: "banana",
              },
            ],
          },
          {
            name: "蔬菜",
            key: "vegetables",
            options: [
              {
                label: "土豆",
                value: "potato",
              },
            ],
          },
        ]}
        value={["banana", "potato"]}
      />
    );
    expect(wrapper.find(Collapse).length).toBe(1);
    expect(wrapper.find(Checkbox.Group).length).toBe(3);
    expect(wrapper.find(Checkbox.Group).at(0).prop("value")).toEqual([
      "banana",
      "potato",
    ]);
    expect(wrapper.find(Checkbox.Group).at(2).prop("value")).toEqual([
      "vegetables",
    ]);
    wrapper.find(Checkbox.Group).at(2).invoke("onChange")([]);
    expect(handleChange).toBeCalledWith(["banana"]);
    wrapper.setProps({
      value: ["banana", "potato"],
    });
    wrapper.find(Checkbox.Group).at(1).invoke("onChange")(["fruits"]);
    expect(handleChange).toBeCalledWith(["banana", "potato", "apple"]);
    wrapper.setProps({
      value: ["apple"],
    });
    wrapper.update();
    expect(wrapper.find(Checkbox.Group).at(0).prop("value")).toEqual(["apple"]);
  });
});
