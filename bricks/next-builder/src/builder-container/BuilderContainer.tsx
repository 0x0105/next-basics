import React from "react";
import classNames from "classnames";
import { BuilderRouteOrBrickNode } from "@next-core/brick-types";
import {
  AbstractBuilderDataManager,
  BuilderRuntimeNode,
  EventDetailOfNodeAdd,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
  useBuilderDataManager,
} from "@next-core/editor-bricks-helper";
import { BuilderToolbox } from "./BuilderToolbox/BuilderToolbox";
import { BuilderCanvas } from "./BuilderCanvas/BuilderCanvas";
import { BrickOptionItem } from "./interfaces";
import { BuilderContextMenu } from "./BuilderContextMenu/BuilderContextMenu";
import { BuilderUIContext } from "./BuilderUIContext";

import styles from "./BuilderContainer.module.css";

export interface BuilderContainerProps {
  dataSource?: BuilderRouteOrBrickNode[];
  brickList?: BrickOptionItem[];
  processing?: boolean;
  initialFullscreen?: boolean;
  onNodeAdd?: (event: CustomEvent<EventDetailOfNodeAdd>) => void;
  onNodeReorder?: (event: CustomEvent<EventDetailOfNodeReorder>) => void;
  onNodeMove?: (event: CustomEvent<EventDetailOfNodeMove>) => void;
  onNodeClick?: (event: CustomEvent<BuilderRuntimeNode>) => void;
  onAskForDeletingNode?: (node: BuilderRuntimeNode) => void;
}

export function LegacyBuilderContainer(
  {
    dataSource,
    brickList,
    processing,
    initialFullscreen,
    onNodeAdd,
    onNodeReorder,
    onNodeMove,
    onNodeClick,
    onAskForDeletingNode,
  }: BuilderContainerProps,
  ref: React.Ref<AbstractBuilderDataManager>
): React.ReactElement {
  const [fullscreen, setFullscreen] = React.useState(initialFullscreen);

  const manager = useBuilderDataManager();

  React.useImperativeHandle(ref, () => manager);

  React.useEffect(() => {
    const removeListenersOfNodeAdd = manager.onNodeAdd(onNodeAdd);
    const removeListenersOfNodeMove = manager.onNodeMove(onNodeMove);
    const removeListenersOfNodeReorder = manager.onNodeReorder(onNodeReorder);
    const removeListenersOfNodeClick = manager.onNodeClick(onNodeClick);
    return () => {
      removeListenersOfNodeAdd();
      removeListenersOfNodeMove();
      removeListenersOfNodeReorder();
      removeListenersOfNodeClick();
    };
  }, [manager, onNodeAdd, onNodeClick, onNodeMove, onNodeReorder]);

  React.useEffect(() => {
    setFullscreen(initialFullscreen);
  }, [initialFullscreen]);

  return (
    <BuilderUIContext.Provider
      value={{
        processing: processing,
        fullscreen: fullscreen,
        setFullscreen: setFullscreen,
      }}
    >
      <div
        className={classNames(styles.builderContainer, {
          [styles.fullscreen]: fullscreen,
        })}
      >
        <BuilderToolbox brickList={brickList} />
        <BuilderCanvas dataSource={dataSource} />
      </div>
      <BuilderContextMenu onAskForDeletingNode={onAskForDeletingNode} />
    </BuilderUIContext.Provider>
  );
}

export const BuilderContainer = React.forwardRef(LegacyBuilderContainer);
