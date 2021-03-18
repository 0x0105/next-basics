import React from "react";
import { act } from "react-dom/test-utils";
import { shallow, mount } from "enzyme";
import { Dropdown, Avatar } from "antd";
import * as brickKit from "@next-core/brick-kit";
import { UserAdminApi } from "@next-sdk/user-service-sdk";
import { Link } from "@next-libs/basic-components";
import { AppBar } from "./AppBar";
import { LaunchpadButton } from "../LaunchpadButton/LaunchpadButton";
import { UserOutlined } from "@ant-design/icons";

jest.mock("@next-sdk/user-service-sdk");
jest.mock("../LaunchpadButton/LaunchpadButton");
jest.mock("../AppBarBreadcrumb/AppBarBreadcrumb");
jest.mock("../AppDocumentLink/AppDocumentLink");

(UserAdminApi.getUserInfoV2 as jest.Mock).mockResolvedValue({
  user_icon: "avatar.png",
});

const spyOnHistoryReplace = jest.fn();
const spyOnHistoryPush = jest.fn();
jest.spyOn(brickKit, "getHistory").mockReturnValue({
  location: {},
  replace: spyOnHistoryReplace,
  push: spyOnHistoryPush,
  createHref: () => "/oops",
} as any);

jest.spyOn(brickKit, "getAuth").mockReturnValue({
  username: "tester",
});

delete window.location;
const spyOnLocationAssign: jest.Mock = jest.fn();
(window as any).location = {
  assign: spyOnLocationAssign,
};

const getFeatureFlags = jest.fn().mockReturnValue({});
const getMiscSettings = jest.fn().mockReturnValue({});
const getMicroApps = jest
  .fn()
  .mockReturnValueOnce([])
  .mockReturnValue([
    {
      id: "account-management",
    },
  ]);
jest.spyOn(brickKit, "getRuntime").mockReturnValue({
  getBrandSettings: () => ({
    base_title: "DevOps 管理专家",
  }),
  getFeatureFlags,
  getMicroApps,
  getMiscSettings,
} as any);

describe("AppBar", () => {
  afterEach(() => {
    document.title = "";
  });

  it("should render default avatar", () => {
    const wrapper = shallow(<AppBar pageTitle="" breadcrumb={null} />);
    expect(wrapper.find(Avatar).prop("size")).toBe("small");
    function Icon(): React.ReactElement {
      return wrapper.find(Avatar).prop("icon") as React.ReactElement;
    }
    const icon = shallow(<Icon />);
    expect(icon.find(UserOutlined).length).toBe(1);
  });

  it("should render user avatar", async () => {
    const wrapper = mount(<AppBar pageTitle="" breadcrumb={null} />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.find(Avatar).props()).toMatchObject({
      size: "small",
      src: "avatar.png",
    });
  });

  it("should handle logout", () => {
    const wrapper = shallow(<AppBar pageTitle="Hello" breadcrumb={null} />);
    (wrapper
      .find(Dropdown)
      .prop("overlay") as React.ReactElement).props.children[1].props.onClick();
    expect(spyOnHistoryReplace).toBeCalledWith("/auth/logout");
  });

  it("should handle redirectToMe", async () => {
    const wrapper = mount(<AppBar pageTitle="Hello" breadcrumb={null} />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    (wrapper
      .find(Dropdown)
      .prop("overlay") as React.ReactElement).props.children[0].props.onClick();
    expect(spyOnHistoryPush).toBeCalledWith("/account-management");
  });

  it("should render when user is not logged in", () => {
    jest.spyOn(brickKit, "getAuth").mockReturnValueOnce({
      username: undefined,
    });
    const wrapper = shallow(<AppBar pageTitle="" breadcrumb={null} />);
    expect(wrapper.find(Avatar).length).toBe(0);
    expect(wrapper.find(".appBar").childAt(1).find(Link).prop("to")).toBe(
      "/auth/login"
    );
  });

  it("should set page title", async () => {
    mount(
      <AppBar
        pageTitle="Hello"
        breadcrumb={[
          {
            text: "First",
            to: "/first",
          },
          {
            text: "Second",
          },
        ]}
      />
    );
    await act(async () => {
      await (global as any).flushPromises();
    });
    expect(document.title === "Hello - DevOps 管理专家");
  });

  it("should set page title when it's empty", async () => {
    mount(<AppBar pageTitle="" breadcrumb={null} />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    expect(document.title === "DevOps 管理专家");
  });

  it("should hide-launchpad-button", () => {
    getFeatureFlags.mockReturnValueOnce({ "hide-launchpad-button": true });
    const wrapper = shallow(<AppBar pageTitle="" breadcrumb={null} />);
    expect(wrapper.find(LaunchpadButton).length).toBe(0);
  });

  it("should hide logout and my-account buttons, add back-to-portal button", () => {
    getFeatureFlags.mockReturnValueOnce({ "hide-user-session-button": true });
    getMiscSettings.mockReturnValueOnce({
      "back-to-portal-url": "https://www.baidu.com",
    });

    const wrapper = shallow(<AppBar pageTitle="" breadcrumb={null} />);
    expect(
      (wrapper.find(Dropdown).prop("overlay") as React.ReactElement).props
        .children.length
    ).toBe(1);
    expect(
      (wrapper.find(Dropdown).prop("overlay") as React.ReactElement).props
        .children[0].title
    ).toBe("回到门户");

    // expect(spyOnLocationAssign).toBeCalledTimes(1);
    // expect(spyOnLocationAssign).toBeCalledWith("");
  });
});
