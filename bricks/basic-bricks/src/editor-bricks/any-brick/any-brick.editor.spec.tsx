import React from "react";
import { shallow } from "enzyme";
import * as helper from "@next-core/editor-bricks-helper";
import { AnyBrickEditor } from "./any-brick.editor";

const mockUseBuilderNode = jest.spyOn(helper, "useBuilderNode");

describe("AnyBrickEditor", () => {
  it("should show default brick", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "brick",
      id: "B-001",
      brick: "any-brick",
      alias: "my-brick",
      $$parsedProperties: {},
    });
    const wrapper = shallow(<AnyBrickEditor nodeUid={1} brick="any-brick" />);
    expect(wrapper.find(".wrapper").prop("className")).toContain("default");
    expect(wrapper.find(".icon").length).toBe(0);
    expect(wrapper.find(".name").text()).toBe("my-brick");
  });

  it("should show provider brick by type", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "provider",
      id: "B-001",
      brick: "any-provider",
      alias: "my-provider",
      $$parsedProperties: {},
    });
    const wrapper = shallow(
      <AnyBrickEditor nodeUid={1} brick="any-provider" />
    );
    expect(wrapper.find(".wrapper").prop("className")).toContain("provider");
    expect(wrapper.find(".icon").length).toBe(1);
    expect(wrapper.find(".name").text()).toBe("my-provider");
  });

  it("should show provider brick by bg", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "brick",
      id: "B-001",
      bg: true,
      brick: "any-provider",
      alias: "my-provider",
      $$parsedProperties: {},
    });
    const wrapper = shallow(
      <AnyBrickEditor nodeUid={1} brick="any-provider" />
    );
    expect(wrapper.find(".wrapper").prop("className")).toContain("provider");
    expect(wrapper.find(".icon").length).toBe(1);
    expect(wrapper.find(".name").text()).toBe("my-provider");
  });

  it("should show legacy template", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "template",
      id: "B-001",
      brick: "any-template",
      alias: "my-template",
      $$parsedProperties: {},
    });
    const wrapper = shallow(
      <AnyBrickEditor nodeUid={1} brick="any-template" />
    );
    expect(wrapper.find(".wrapper").prop("className")).toContain("template");
    expect(wrapper.find(".icon").length).toBe(1);
    expect(wrapper.find(".name").text()).toBe("my-template");
  });

  it("should show portal brick", () => {
    mockUseBuilderNode.mockReturnValueOnce({
      type: "brick",
      id: "B-001",
      brick: "any-portal",
      alias: "my-portal",
      portal: true,
      $$parsedProperties: {},
    });
    const wrapper = shallow(<AnyBrickEditor nodeUid={1} brick="any-portal" />);
    expect(wrapper.find(".wrapper").prop("className")).toContain("portal");
    expect(wrapper.find(".icon").length).toBe(1);
    expect(wrapper.find(".name").text()).toBe("my-portal");
  });
});
