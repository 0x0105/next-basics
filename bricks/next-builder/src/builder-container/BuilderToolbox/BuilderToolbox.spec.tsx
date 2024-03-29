import React from "react";
import { shallow } from "enzyme";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { BuilderToolbox } from "./BuilderToolbox";
import { useBuilderUIContext } from "../BuilderUIContext";
import { defaultToolboxTab } from "../constants";
import { BuilderDataType, ToolboxTab } from "../interfaces";

jest.mock("../BuilderUIContext");

const mockUseBuilderUIContext = useBuilderUIContext as jest.MockedFunction<
  typeof useBuilderUIContext
>;

describe("BuilderToolbox", () => {
  let toolboxTab: ToolboxTab;
  let dataType: BuilderDataType;
  beforeEach(() => {
    toolboxTab = defaultToolboxTab;
    dataType = BuilderDataType.ROUTE_OF_BRICKS;
    mockUseBuilderUIContext.mockImplementation(() => ({
      dataType,
      fullscreen: false,
      toolboxTab,
      setToolboxTab: ((tab: ToolboxTab) => {
        toolboxTab = tab;
      }) as any,
    }));
  });

  it("should show storyboard tree view by default", () => {
    const wrapper = shallow(<BuilderToolbox />);
    expect(wrapper.find("StoryboardTreeView").length).toBe(1);
    expect(wrapper.find("BrickLibrary").length).toBe(0);
  });

  it("should switch to library", () => {
    expect(toolboxTab).toBe(defaultToolboxTab);
    const wrapper = shallow(<BuilderToolbox />);
    wrapper.find(".tabLink").at(1).invoke("onClick")(null);
    expect(toolboxTab).toBe(ToolboxTab.LIBRARY);
    const wrapper2 = shallow(<BuilderToolbox />);
    expect(wrapper2.find("BrickLibrary").length).toBe(1);
  });

  it("should switch to events view", () => {
    expect(toolboxTab).toBe(defaultToolboxTab);
    const wrapper = shallow(<BuilderToolbox />);
    wrapper.find(".tabLink").at(2).invoke("onClick")(null);
    expect(toolboxTab).toBe(ToolboxTab.EVENTS_VIEW);
    const wrapper2 = shallow(<BuilderToolbox />);
    expect(wrapper2.find("EventsView").length).toBe(1);
  });

  it("should switch to data view", () => {
    const wrapper = shallow(<BuilderToolbox />);
    wrapper.find(".tabLink").at(3).invoke("onClick")(null);
    expect(toolboxTab).toBe(ToolboxTab.DATA_VIEW);
    const wrapper2 = shallow(<BuilderToolbox />);
    expect(wrapper2.find("DataView").length).toBe(1);
  });

  it("should display 4 tabLink", () => {
    dataType = BuilderDataType.CUSTOM_TEMPLATE;
    const wrapper = shallow(<BuilderToolbox />);
    expect(wrapper.find(".tabLink").length).toBe(4);
  });

  it("should enter fullscreen", () => {
    let fullscreen = false;
    const setFullscreen = jest.fn((update) => {
      fullscreen = update(fullscreen);
    });
    mockUseBuilderUIContext.mockImplementation(() => ({
      fullscreen,
      setFullscreen,
    }));
    const wrapper = shallow(<BuilderToolbox />);
    expect(wrapper.find(FullscreenOutlined).length).toBe(1);
    expect(wrapper.find(FullscreenExitOutlined).length).toBe(0);
    wrapper.find(".tabLink").last().invoke("onClick")(null);
    expect(setFullscreen).toBeCalled();
    expect(fullscreen).toBe(true);
  });

  it("should exit fullscreen", () => {
    let fullscreen = true;
    const setFullscreen = jest.fn((update) => {
      fullscreen = update(fullscreen);
    });
    mockUseBuilderUIContext.mockImplementation(() => ({
      fullscreen,
      setFullscreen,
    }));
    const wrapper = shallow(<BuilderToolbox />);
    expect(wrapper.find(FullscreenOutlined).length).toBe(0);
    expect(wrapper.find(FullscreenExitOutlined).length).toBe(1);
    wrapper.find(".tabLink").last().invoke("onClick")(null);
    expect(setFullscreen).toBeCalled();
    expect(fullscreen).toBe(false);
  });
});
