import { shallow } from "enzyme";
import ReactDOM from "react-dom";
import { BuilderContainer } from "./BuilderContainer";
import {
  BuilderClipboard,
  BuilderClipboardType,
  BuilderPasteDetailOfCopy,
  BuilderPasteDetailOfCut,
} from "./interfaces";
import { BuilderContainerElement } from "./";
import "./";

const spyOnRender = jest
  .spyOn(ReactDOM, "render")
  .mockImplementation(() => void 0);
const unmountComponentAtNode = jest
  .spyOn(ReactDOM, "unmountComponentAtNode")
  .mockImplementation(() => null);

describe("next-builder.builder-container", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a custom element", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;
    // element.appId = "test-app";

    expect(spyOnRender).not.toBeCalled();
    document.body.appendChild(element);
    expect(spyOnRender).toBeCalled();

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    expect(wrapper.find(BuilderContainer).props()).toMatchObject({
      initialFullscreen: false,
      initialToolboxTab: null,
      initialEventStreamNodeId: null,
      initialClipboardType: null,
      initialClipboardSource: null,
    });

    document.body.removeChild(element);
    expect(unmountComponentAtNode).toBeCalled();
  });

  it("should init clipboard as copy", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;
    element.clipboardType = BuilderClipboardType.COPY;
    element.clipboardSource = "B-001";

    document.body.appendChild(element);

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    expect(wrapper.find(BuilderContainer).props()).toMatchObject({
      initialClipboardType: "copy",
      initialClipboardSource: "B-001",
    });

    document.body.removeChild(element);
  });

  it("should init clipboard as cut", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;
    element.clipboardType = BuilderClipboardType.CUT;
    element.clipboardSource = "instance-a";

    document.body.appendChild(element);

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    expect(wrapper.find(BuilderContainer).props()).toMatchObject({
      initialClipboardType: "cut",
      initialClipboardSource: "instance-a",
    });

    document.body.removeChild(element);
  });

  it("should handle clipboard change", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;

    document.body.appendChild(element);

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    const onClipboardChange = jest.fn();
    element.addEventListener("clipboard.change", onClipboardChange);

    // No events triggered if clipboard not changed.
    wrapper.find(BuilderContainer).invoke("onClipboardChange")(null);
    expect(onClipboardChange).not.toBeCalled();

    const clipboardOfCopy: BuilderClipboard = {
      type: BuilderClipboardType.COPY,
      sourceId: "B-001",
    };
    wrapper.find(BuilderContainer).invoke("onClipboardChange")(clipboardOfCopy);
    expect(onClipboardChange).toBeCalledWith(
      expect.objectContaining({
        detail: { clipboard: clipboardOfCopy },
      })
    );

    const clipboardOfCut: BuilderClipboard = {
      type: BuilderClipboardType.CUT,
      sourceInstanceId: "instance-a",
    };
    wrapper.find(BuilderContainer).invoke("onClipboardChange")(clipboardOfCut);
    expect(onClipboardChange).toBeCalledWith(
      expect.objectContaining({
        detail: { clipboard: clipboardOfCut },
      })
    );

    wrapper.find(BuilderContainer).invoke("onClipboardChange")(null);
    expect(onClipboardChange).toBeCalledWith(
      expect.objectContaining({
        detail: { clipboard: null },
      })
    );

    document.body.removeChild(element);
  });

  it("should handle copy and paste", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;

    document.body.appendChild(element);

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    const onNodeCopyPaste = jest.fn();
    element.addEventListener("node.copy.paste", onNodeCopyPaste);

    const detail: BuilderPasteDetailOfCopy = {
      sourceId: "B-001",
      targetId: "B-002",
    };
    wrapper.find(BuilderContainer).invoke("onNodeCopyPaste")(detail);
    expect(onNodeCopyPaste).toBeCalledWith(
      expect.objectContaining({
        detail,
      })
    );

    document.body.removeChild(element);
  });

  it("should handle cut and paste", () => {
    const element = document.createElement(
      "next-builder.builder-container"
    ) as BuilderContainerElement;

    document.body.appendChild(element);

    const wrapper = shallow(spyOnRender.mock.calls[0][0] as any);
    const onNodeCutPaste = jest.fn();
    element.addEventListener("node.cut.paste", onNodeCutPaste);

    const detail: BuilderPasteDetailOfCut = {
      sourceInstanceId: "instance-a",
      targetInstanceId: "instance-b",
    };
    wrapper.find(BuilderContainer).invoke("onNodeCutPaste")(detail);
    expect(onNodeCutPaste).toBeCalledWith(
      expect.objectContaining({
        detail,
      })
    );

    document.body.removeChild(element);
  });
});
