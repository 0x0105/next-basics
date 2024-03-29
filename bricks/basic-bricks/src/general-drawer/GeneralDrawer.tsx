import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer } from "antd";

import { NS_BASIC_BRICKS, K } from "../i18n/constants";

interface GeneralDrawerProps {
  visible: boolean;
  title?: string;
  width?: number;
  getContainer?: HTMLElement;
  closable?: boolean;
  bodyStyle?: Record<string, any>;
  drawerStyle?: Record<string, any>;
  hasFooter?: boolean;
}

export function GeneralDrawer(props: GeneralDrawerProps): React.ReactElement {
  const { t } = useTranslation(NS_BASIC_BRICKS);
  const title = (
    <div className="header">
      {props.title ? (
        <span>{props.title}</span>
      ) : (
        <div className="flexContainer">
          <slot id="headerLeft" name="headerLeft"></slot>
        </div>
      )}
      <div className="flexContainer">
        <slot id="headerRight" name="headerRight"></slot>
      </div>
    </div>
  );

  const [maxContentHeight, setMaxContentHeight] = React.useState<number>();

  React.useEffect(() => {
    if (props.hasFooter) {
      const normalHeaderHeight = 64;
      const drawerContentPadding = 24;
      const manualFix = 4;
      let height =
        window.innerHeight -
        normalHeaderHeight -
        drawerContentPadding -
        manualFix;
      const normalFooterHeight = 64;
      height -= normalFooterHeight;
      setMaxContentHeight(height);
    }
  }, [props.hasFooter]);

  return (
    <Drawer
      title={title}
      width={props.width}
      visible={props.visible}
      getContainer={props.getContainer}
      closable={props.closable}
      bodyStyle={props.bodyStyle}
      drawerStyle={props.drawerStyle}
    >
      <div className="content" style={{ maxHeight: maxContentHeight }}>
        <slot id="content" name="content"></slot>
      </div>
      {props.hasFooter && (
        <div className="footer">
          <div className="footer-inner">
            <slot id="footer" name="footer"></slot>
          </div>
        </div>
      )}
    </Drawer>
  );
}
