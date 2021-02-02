import ReactDOM from "react-dom";
import "./";

const spyOnRender = jest.spyOn(ReactDOM, "render").mockImplementation(() => {});
const unmountComponentAtNode = jest
  .spyOn(ReactDOM, "unmountComponentAtNode")
  .mockImplementation((() => {}) as any);

describe("brick-tree", () => {
  it("should create a custom element", async () => {
    const element = document.createElement("presentational-bricks.brick-tree");
    // Always waiting for async `(dis)connectedCallback`
    await jest.runAllTimers();
    expect(spyOnRender).not.toBeCalled();
    document.body.appendChild(element);
    await jest.runAllTimers();
    expect(spyOnRender).toBeCalled();
    Object.assign(element, {
      dataSource: [
        {
          title: "0",
          key: "0",
          children: [
            {
              title: "0-0",
              key: "00"
            }
          ]
        },
        {
          title: "1",
          key: "1",
          children: [
            {
              title: "1-0",
              key: "10"
            }
          ]
        }
      ],
      configProps: {
        checkable: true
      },
      searchable: true
    });
    document.body.removeChild(element);
    await jest.runAllTimers();
    expect(unmountComponentAtNode).toBeCalled();
  });
});
