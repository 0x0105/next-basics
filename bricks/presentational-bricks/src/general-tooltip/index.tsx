import React from "react";
import ReactDOM from "react-dom";
import { BrickWrapper, UpdatingElement, property } from "@next-core/brick-kit";
import { GeneralTooltip, GeneralTooltipProps } from "./GeneralTooltip";

export type TooltipPlacement =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "leftTop"
  | "leftBottom"
  | "rightTop"
  | "rightBottom";
export interface TooltipConfig {
  /**
   * 气泡框位置，可选 `top` `left` `right` `bottom` `topLeft` `topRight` `bottomLeft` `bottomRight` `leftTop` `leftBottom` `rightTop` `rightBottom`
   */
  placement?: TooltipPlacement;
  /**
   * 箭头是否指向目标元素中心
   */
  arrowPointAtCenter?: boolean;
}

/**
 * @id presentational-bricks.general-tooltip
 * @name presentational-bricks.general-tooltip
 * @docKind brick
 * @description 普通的 tooltip
 * @author jo
 * @slots
 * @history
 * 1.153.0:新增属性 `text`
 * 1.59.2:新增构件 `presentational-bricks.general-tooltip`
 * @memo
 * @noInheritDoc
 */
export class GeneralTooltipElement extends UpdatingElement {
  /**
   * @kind [MenuIcon](http://docs.developers.easyops.cn/docs/brick-next/icon)
   * @required true
   * @default -
   * @description 图标配置
   */
  @property({
    attribute: false,
  })
  icon: GeneralTooltipProps["icon"];

  /**
   * @kind string
   * @required false
   * @default -
   * @description 文案
   */
  @property()
  text: string;

  /**
   * @kind object
   * @required false
   * @default -
   * @description 图标容器相关样式
   */
  @property({
    attribute: false,
  })
  iconContainerStyle: React.CSSProperties;

  /**
   * @kind string | string[]
   * @required true
   * @default -
   * @description 提示内容, 数组表示多行显示, 可根据平台提供的 transform 机制转换成所需的提示内容
   */
  @property({
    attribute: false,
  })
  content: GeneralTooltipProps["content"];

  /**
   * @kind string
   * @required false
   * @default -
   * @description 提示内容的标题， 当 type = popover 时才生效
   */
  @property()
  header: string;

  /**
   * @kind tooltip | popover
   * @required false
   * @default tooltip
   * @description 类型设置
   */
  @property({
    attribute: false,
  })
  type: GeneralTooltipProps["type"] = "tooltip";

  /**
   * @kind `TooltipConfig`
   * @required false
   * @default -
   * @description tooltip的配置,配置属性见TooltipConfig
   */
  @property({ attribute: false })
  tooltipConfig: TooltipConfig;

  connectedCallback(): void {
    this.style.display = "inline-block";
    this._render();
  }

  disconnectedCallback(): void {
    ReactDOM.unmountComponentAtNode(this);
  }

  protected _render(): void {
    // istanbul ignore else
    if (this.isConnected) {
      ReactDOM.render(
        <BrickWrapper>
          <GeneralTooltip
            icon={this.icon}
            text={this.text}
            iconContainerStyle={this.iconContainerStyle}
            content={this.content}
            title={this.header}
            type={this.type}
            tooltipConfig={this.tooltipConfig}
          />
        </BrickWrapper>,
        this
      );
    }
  }
}

customElements.define(
  "presentational-bricks.general-tooltip",
  GeneralTooltipElement
);
