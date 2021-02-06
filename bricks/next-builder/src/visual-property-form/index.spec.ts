import ReactDOM from "react-dom";
import "./";

const spyOnRender = jest
  .spyOn(ReactDOM, "render")
  .mockImplementation(() => null);
const unmountComponentAtNode = jest
  .spyOn(ReactDOM, "unmountComponentAtNode")
  .mockImplementation(() => null);

// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.mock("@next-libs/editor-components", () => {});

describe("next-builder.visual-property-form", () => {
  it("should create a custom element visual-property-form", async () => {
    const element = document.createElement(
      "next-builder.visual-property-form"
    ) as any;
    expect(spyOnRender).not.toBeCalled();
    document.body.appendChild(element);

    const formUtilsMock = {
      validateFields: jest.fn(() => () => {
        "lucy";
      }),
      resetPropertyFields: jest.fn(),
    };
    element._formUtils = {
      current: formUtilsMock,
    };

    element.resetFields();
    expect(formUtilsMock.resetPropertyFields).toHaveBeenCalled();

    const sypOnDispatchEvent = jest.spyOn(element, "dispatchEvent");

    await element.validate();

    expect((sypOnDispatchEvent.mock.calls[0][0] as CustomEvent).type).toEqual(
      "validate.success"
    );

    expect(spyOnRender).toBeCalled();
    document.body.removeChild(element);
    expect(unmountComponentAtNode).toBeCalled();
  });
});
