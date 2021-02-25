import React from "react";
import ReactDOM from "react-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  BrickWrapper,
  event,
  EventEmitter,
  method,
  property,
  UpdatingElement,
} from "@next-core/brick-kit";
import { BuilderRouteOrBrickNode, ContextConf } from "@next-core/brick-types";
import {
  EventDetailOfNodeAdd,
  NodeInstance,
  EventDetailOfNodeMove,
  EventDetailOfNodeAddStored,
  EventDetailOfNodeReorder,
  BuilderRuntimeNode,
  BuilderProvider,
  AbstractBuilderDataManager,
} from "@next-core/editor-bricks-helper";
import { BrickOptionItem, ToolboxTab } from "./interfaces";
import { BuilderContainer } from "./BuilderContainer";
import { defaultToolboxTab } from "./constants";

interface FulfilledEventDetailOfBrickAdd extends EventDetailOfNodeAdd {
  nodeData: NodeInstance & {
    appId: string;
  };
}

/**
 * @id next-builder.builder-container
 * @author stevewang
 * @history
 * 1.x.0: 新增构件 `next-builder.builder-container`
 * @docKind brick
 * @noInheritDoc
 */
export class BuilderContainerElement extends UpdatingElement {
  @property()
  appId: string;

  @property({ attribute: false })
  dataSource: BuilderRouteOrBrickNode[];

  @property({ attribute: false })
  brickList: BrickOptionItem[];

  @property({ type: Boolean })
  processing: boolean;

  @property({ type: Boolean })
  fullscreen: boolean;

  @property()
  toolboxTab: ToolboxTab;

  @property({ type: Number })
  eventStreamActiveNodeUid: number;

  @event({
    type: "node.add",
  })
  private _nodeAddEmitter: EventEmitter<FulfilledEventDetailOfBrickAdd>;

  @event({
    type: "node.reorder",
  })
  private _nodeReorderEmitter: EventEmitter<EventDetailOfNodeReorder>;

  @event({
    type: "node.move",
  })
  private _nodeMoveEmitter: EventEmitter<EventDetailOfNodeMove>;

  @event({
    type: "node.click",
  })
  private _nodeClickEmitter: EventEmitter<BuilderRuntimeNode>;

  @event({
    type: "node.delete.ask",
  })
  private _nodeDeleteAskEmitter: EventEmitter<BuilderRuntimeNode>;

  @event({
    type: "node.delete.confirmed",
  })
  private _nodeDeleteConfirmedEmitter: EventEmitter<BuilderRuntimeNode>;

  @event({
    type: "context.update",
  })
  private _contextUpdateEmitter: EventEmitter<ContextConf[]>;

  @event({
    type: "fullscreen.toggle",
  })
  private _fullscreenToggleEmitter: EventEmitter<{
    fullscreen: boolean;
  }>;

  @event({
    type: "toolbox.tab.switch",
  })
  private _toolboxTabSwitchEmitter: EventEmitter<{
    toolboxTab: ToolboxTab;
  }>;

  @event({
    type: "eventStream.activeNodeUid.switch",
  })
  private _eventStreamActiveNodeUidSwitchEmitter: EventEmitter<{
    nodeUid: number;
  }>;

  private _handleNodeAdd = (event: CustomEvent<EventDetailOfNodeAdd>): void => {
    this._nodeAddEmitter.emit({
      ...event.detail,
      nodeData: {
        appId: this.appId,
        ...event.detail.nodeData,
      },
    });
  };

  private _handleNodeReorder = (
    event: CustomEvent<EventDetailOfNodeReorder>
  ): void => {
    this._nodeReorderEmitter.emit({
      ...event.detail,
    });
  };

  private _handleNodeMove = (
    event: CustomEvent<EventDetailOfNodeMove>
  ): void => {
    this._nodeMoveEmitter.emit({
      ...event.detail,
    });
  };

  private _handleNodeClick = (event: CustomEvent<BuilderRuntimeNode>): void => {
    this._nodeClickEmitter.emit({
      ...event.detail,
    });
  };

  private _handleAskForDeletingNode = (node: BuilderRuntimeNode): void => {
    this._nodeDeleteAskEmitter.emit({
      ...node,
    });
  };

  private _currentFullscreen?: boolean;

  private _handleToggleFullscreen = (fullscreen: boolean): void => {
    if (fullscreen !== this._currentFullscreen) {
      this._currentFullscreen = fullscreen;
      this._fullscreenToggleEmitter.emit({
        fullscreen,
      });
    }
  };

  private _currentToolboxTab?: ToolboxTab;

  private _handleSwitchToolboxTab = (toolboxTab: ToolboxTab): void => {
    if (toolboxTab !== this._currentToolboxTab) {
      this._currentToolboxTab = toolboxTab;
      this._toolboxTabSwitchEmitter.emit({
        toolboxTab,
      });
    }
  };

  private _currentEventStreamActiveNodeUid?: number;

  private _handleSwitchEventStreamActiveNode = (nodeUid: number): void => {
    if (nodeUid !== this._currentEventStreamActiveNodeUid) {
      this._currentEventStreamActiveNodeUid = nodeUid;
      this._eventStreamActiveNodeUidSwitchEmitter.emit({
        nodeUid,
      });
    }
  };

  private _managerRef = React.createRef<AbstractBuilderDataManager>();

  private _handleContextUpdate = (context: ContextConf[]): void => {
    this._contextUpdateEmitter.emit(context);
  };

  @method()
  nodeAddStored(detail: EventDetailOfNodeAddStored): void {
    this._managerRef.current.nodeAddStored(detail);
  }

  @method()
  nodeDeleteConfirmed(node: BuilderRuntimeNode): void {
    this._managerRef.current.nodeDelete(node);
    this._nodeDeleteConfirmedEmitter.emit({
      ...node,
    });
  }

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
      this._currentFullscreen = this.fullscreen;
      this._currentToolboxTab = this.toolboxTab ?? defaultToolboxTab;
      this._currentEventStreamActiveNodeUid = this.eventStreamActiveNodeUid;
      ReactDOM.render(
        <BrickWrapper>
          <BuilderProvider>
            <DndProvider backend={HTML5Backend}>
              <BuilderContainer
                ref={this._managerRef}
                dataSource={this.dataSource}
                brickList={this.brickList}
                processing={this.processing}
                initialFullscreen={this.fullscreen}
                initialToolboxTab={this._currentToolboxTab}
                initialEventStreamActiveNodeUid={this.eventStreamActiveNodeUid}
                onNodeAdd={this._handleNodeAdd}
                onNodeReorder={this._handleNodeReorder}
                onNodeMove={this._handleNodeMove}
                onNodeClick={this._handleNodeClick}
                onAskForDeletingNode={this._handleAskForDeletingNode}
                onToggleFullscreen={this._handleToggleFullscreen}
                onSwitchToolboxTab={this._handleSwitchToolboxTab}
                onSwitchEventStreamActiveNode={
                  this._handleSwitchEventStreamActiveNode
                }
                onContextUpdate={this._handleContextUpdate}
              />
            </DndProvider>
          </BuilderProvider>
        </BrickWrapper>,
        this
      );
    }
  }
}

customElements.define(
  "next-builder.builder-container",
  BuilderContainerElement
);
