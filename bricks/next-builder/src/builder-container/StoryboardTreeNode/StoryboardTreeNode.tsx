/* istanbul ignore file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import { useDrag, useDrop } from "react-dnd";
import classNames from "classnames";
import {
  BranchesOutlined,
  DatabaseFilled,
  MessageFilled,
} from "@ant-design/icons";
import {
  useBuilderDataManager,
  useBuilderNode,
  useBuilderNodeMountPoints,
  useBuilderParentNode,
  useCanDrop,
  useBuilderGroupedChildNodes,
  isRouteNode,
} from "@next-core/editor-bricks-helper";
import { StoryboardTreeMountPoint } from "../StoryboardTreeMountPoint/StoryboardTreeMountPoint";
import { treeViewPaddingUnit } from "../constants";
import { DraggingNodeItem, StoryboardTreeTransferType } from "../interfaces";
import { handleDropOnNode } from "./handleDropOnNode";

import styles from "./StoryboardTreeNode.module.css";

export interface StoryboardTreeNodeProps {
  nodeUid: number;
  mountPoint: string;
  level: number;
}

export enum DisplayType {
  DEFAULT = "default",
  PROVIDER = "provider",
  PORTAL = "portal",
  ROUTE = "route",
}

export function StoryboardTreeNode({
  nodeUid,
  mountPoint,
  level,
}: StoryboardTreeNodeProps): React.ReactElement {
  const node = useBuilderNode({ nodeUid });
  const mountPoints = useBuilderNodeMountPoints({ nodeUid });
  const parentNode = useBuilderParentNode(nodeUid);
  const siblingGroups = useBuilderGroupedChildNodes({
    nodeUid: parentNode.$$uid,
  });
  const manager = useBuilderDataManager();
  const canDrop = useCanDrop();

  const handleClick = React.useCallback(() => {
    manager.nodeClick(node);
  }, [manager, node]);

  const [{ isDragging }, dragRef, draggingPreviewRef] = useDrag({
    item: {
      type: StoryboardTreeTransferType.NODE,
      nodeUid,
      nodeId: node.id,
      nodeInstanceId: node.instanceId,
      nodeType: node.type,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isDraggingOverCurrent }, dropRef] = useDrop({
    accept: StoryboardTreeTransferType.NODE,
    canDrop: (item: DraggingNodeItem) =>
      canDrop(item.nodeUid, nodeUid) &&
      (Number(isRouteNode(node)) ^
        Number(isRouteNode({ type: item.nodeType } as any))) ===
        0,
    collect: (monitor) => ({
      isDraggingOverCurrent: monitor.isOver() && monitor.canDrop(),
    }),
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        let droppingIndex = -1;
        for (const group of siblingGroups) {
          droppingIndex = group.childNodes.findIndex(
            (n) => n.$$uid === nodeUid
          );
          if (droppingIndex > -1) {
            // When dropping a node on another node,
            // we say it drops *under* the target node.
            // So add `droppingIndex` by 1.
            droppingIndex += 1;
            break;
          }
        }
        handleDropOnNode({
          draggingItem: item,
          droppingMountPoint: mountPoint,
          droppingParentNode: parentNode,
          droppingSiblingGroups: siblingGroups,
          droppingIndex,
          manager,
        });
      }
    },
  });

  let icon: JSX.Element;
  let displayType = DisplayType.DEFAULT;

  if (node.type === "provider" || node.bg) {
    displayType = DisplayType.PROVIDER;
    icon = <DatabaseFilled />;
  } else if (node.portal) {
    displayType = DisplayType.PORTAL;
    icon = <MessageFilled />;
  } else if (isRouteNode(node)) {
    displayType = DisplayType.ROUTE;
    icon = <BranchesOutlined />;
  }

  return (
    <li
      className={classNames(
        styles.treeNode,
        {
          [styles.dragging]: isDragging,
          [styles.draggingNodeOverCurrent]: isDraggingOverCurrent,
        },
        styles[displayType]
      )}
      ref={draggingPreviewRef}
    >
      <div
        className={styles.nodeNameWrapper}
        style={{
          paddingLeft: level * treeViewPaddingUnit,
        }}
        onClick={handleClick}
        ref={(node) => dragRef(dropRef(node))}
      >
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.nodeName}>{node.alias}</div>
      </div>
      {mountPoints.length > 0 && (
        <ul className={styles.mountPointList}>
          {mountPoints.map((childMountPoint) => (
            <StoryboardTreeMountPoint
              level={level + 1}
              key={childMountPoint}
              nodeUid={nodeUid}
              mountPoint={childMountPoint}
            />
          ))}
        </ul>
      )}
      <div
        className={styles.dropCursor}
        style={{
          left: level * treeViewPaddingUnit,
        }}
      />
    </li>
  );
}
