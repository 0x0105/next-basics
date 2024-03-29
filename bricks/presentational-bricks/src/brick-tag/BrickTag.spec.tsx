import React from "react";
import { shallow, mount } from "enzyme";
import { BrickTag, TagTypeProps, circleIcon } from "./BrickTag";
import { GeneralIcon } from "@next-libs/basic-components";
import { Icon as LegacyIcon } from "@ant-design/compatible";

describe("BrickTag", () => {
  it("should work when componentType is CheckableTag", () => {
    const handleOnChange = jest.fn();
    const props = {
      componentType: TagTypeProps.CheckableTag,
      configProps: {
        color: "#108ee9",
      },
      textEllipsis: true,
      tagStyle: {
        color: "#fff",
      },
      tagCheckedStyle: {
        color: "#ccc",
      },
      tagHoverStyle: {
        color: "red",
      },
      defaultCheckedTag: "b",
      handleOnChange,
      multipleCheck: true,
      tagList: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
        { key: "c", label: "c" },
        { key: "d", label: "d" },
      ],
      label: "label: ",
    };
    const wrapper = mount(<BrickTag {...props} />);
    expect(wrapper.find("CheckableTag").length).toEqual(4);
    wrapper.find("CheckableTag").at(0).simulate("mouseenter");
    expect(wrapper.find("CheckableTag").at(0).prop("style").color).toBe("red");
    wrapper.find("CheckableTag").at(0).simulate("mouseleave");
    expect(wrapper.find("CheckableTag").at(0).prop("style").color).toBe("#fff");
    wrapper.find("CheckableTag").at(0).invoke("onChange")("a", true);
    expect(handleOnChange).toHaveBeenCalled();
    wrapper.setProps({
      defaultCheckedTag: ["a"],
    });
    wrapper.update();
    expect(wrapper.find("CheckableTag").at(0).prop("checked")).toBe(true);

    wrapper.setProps({
      multipleCheck: false,
    });
    wrapper.update();

    wrapper.find("CheckableTag").at(1).invoke("onChange")("b", true);
    expect(handleOnChange).toHaveBeenCalled();
    wrapper.setProps({
      defaultCheckedTag: ["b"],
    });
    wrapper.update();
    expect(wrapper.find("CheckableTag").at(0).prop("checked")).toBe(false);
    expect(wrapper.find("CheckableTag").at(1).prop("checked")).toBe(true);
  });
  it("should work when Tag has TagCircle", () => {
    const props = {
      showTagCircle: true,
      componentType: TagTypeProps.Tag,
      tagList: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
        { key: "c", label: "c" },
        { key: "d", label: "d" },
      ],
    };
    const wrapper = shallow(<BrickTag {...props} />);
    expect(wrapper.find("Tag").at(1).find(GeneralIcon).prop("icon")).toEqual(
      circleIcon
    );
  });
  it("should work when Tag has icon", () => {
    const adIcon = {
      lib: "fa",
      icon: "ad",
      prefix: "fas",
    };
    const searchIcon = <LegacyIcon type="search" />;
    const props = {
      componentType: TagTypeProps.Tag,
      tagList: [
        { key: "a", label: "a", icon: "search" },
        { key: "b", label: "b", icon: adIcon },
      ],
    };
    const wrapper = shallow(<BrickTag {...props} />);
    expect(wrapper.find("Tag").at(0).prop("icon")).toEqual(searchIcon);
    expect(wrapper.find("Tag").at(1).find(GeneralIcon).prop("icon")).toEqual(
      adIcon
    );
  });
  it("should work when shape is round", () => {
    const props = {
      shape: "round",
      showTagCircle: true,
      componentType: TagTypeProps.Tag,
      tagList: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
        { key: "c", label: "c" },
        { key: "d", label: "d" },
      ],
    };
    const wrapper = shallow(<BrickTag {...props} />);
    expect(wrapper.find(".round")).toHaveLength(4);
  });

  it("should work with specific color and disabledTooltip and disabled in tagList", () => {
    const props = {
      componentType: TagTypeProps.Tag,
      color: "red",
      tagList: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
        { key: "c", label: "c", color: "gray" },
        { key: "d", label: "d", disabled: true, disabledTooltip: "禁用标签" },
      ],
    };
    const wrapper = shallow(<BrickTag {...props} />);
    expect(wrapper.find("Tag")).toHaveLength(4);
    expect(wrapper.find("Tag").at(0).prop("color")).toBe("red");
    expect(wrapper.find("Tag").at(2).prop("color")).toBe("gray");
    expect(wrapper.find("Tooltip")).toHaveLength(1);
  });
});
