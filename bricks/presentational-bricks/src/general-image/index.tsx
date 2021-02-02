import React from "react";
import ReactDOM from "react-dom";
import { BrickWrapper, UpdatingElement, property } from "@next-core/brick-kit";
import { Image } from "antd";
import { GeneralImage, GeneralImageProps } from "./GeneralImage";

/**
 * @id presentational-bricks.general-image
 * @author Lynette
 * @history
 * 1.134.0: 新增构件 `presentational-bricks.general-image`
 * @docKind brick
 * @noInheritDoc
 */
export class GeneralImageElement extends UpdatingElement {
  /**
   * @default true
   * @required
   * @description 是否开启预览
   */
  @property({
    attribute: false,
  })
  preview = true;

  /**
   * @default -
   * @required
   * @description 图片地址
   */
  @property()
  imgSrc: string;

  /**
   * @default -
   * @required
   * @description 图像描述
   */
  @property()
  imgAlt: string;

  /**
   * @default -
   * @required
   * @description 加载失败容错地址
   */
  @property()
  fallback: string;

  /**
   * @default -
   * @required
   * @description 加载占位, 为 true 时使用默认占位
   */
  @property()
  placeholder: string;

  /**
   * @default -
   * @required
   * @description 图像高度
   */
  @property({
    attribute: false,
  })
  imgHeight: string | number;

  /**
   * @default -
   * @required
   * @description 图像宽度
   */
  @property({
    attribute: false,
  })
  imgWidth: string | number;

  /**
   * @kind Record<string, any>
   * @default -
   * @required -
   * @description 数据源，搭配 extra 使用时会把该数据传入到自定义构件中使用
   */
  @property({
    attribute: false,
  })
  dataSource: GeneralImageProps["dataSource"];

  /**
   * @kind UseBrickConf
   * @default -
   * @required -
   * @description 支持在图片下方增加自定义构件
   */
  @property({
    attribute: false,
  })
  extra: GeneralImageProps["extra"];

  /**
   * @kind Record<string, any>
   * @default -
   * @required -
   * @description 包裹自定义构件容器的样式
   */
  @property({
    attribute: false,
  })
  extraContainerStyle: React.CSSProperties;

  connectedCallback(): void {
    // Don't override user's style settings.
    // istanbul ignore else
    if (!this.style.display) {
      this.style.display = "block";
    }
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
          <GeneralImage
            width={this.imgWidth}
            height={this.imgHeight}
            src={this.imgSrc}
            alt={this.imgAlt}
            preview={this.preview}
            placeholder={this.placeholder}
            fallback={this.fallback}
            dataSource={this.dataSource}
            extra={this.extra}
            extraContainerStyle={this.extraContainerStyle}
          />
        </BrickWrapper>,
        this
      );
    }
  }
}

customElements.define(
  "presentational-bricks.general-image",
  GeneralImageElement
);
