/* istanbul ignore file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BrickEventHandler,
  BuiltinBrickEventHandler,
  CustomBrickEventHandler,
  ExecuteCustomBrickEventHandler,
  SetPropsCustomBrickEventHandler,
  UseProviderEventHandler,
} from "@next-core/brick-types";
import { EventDownstreamNode, EventDownstreamType } from "./interfaces";
import { styleConfig } from "./styleConfig";

import styles from "./EventNodeComponent.module.css";

export interface EventNodeComponentProps {
  eventNode: EventDownstreamNode;
}

export function EventNodeComponent({
  eventNode,
}: EventNodeComponentProps): React.ReactElement {
  return (
    <div
      className={styles.eventNode}
      style={{
        ...styleConfig.node,
        left: -styleConfig.node.width / 2,
        top: -eventNode.height / 2,
        height: eventNode.height,
      }}
    >
      <div
        className={styles.title}
        style={{
          ...styleConfig.title,
          marginBottom:
            eventNode.type === EventDownstreamType.ROOT
              ? undefined
              : styleConfig.titleMarginBottom,
        }}
      >
        {eventNode.type === EventDownstreamType.ROOT
          ? `${eventNode.node.alias}`
          : eventNode.type === EventDownstreamType.EVENT
          ? eventNode.eventType
          : `[callback] ${eventNode.callbackType}`}
      </div>
      <ul className={styles.items}>
        {eventNode.type !== EventDownstreamType.ROOT &&
          eventNode.handlers.map((handler, index) => (
            <EventNodeHandlerComponent
              key={index}
              handler={handler}
              isLast={index === eventNode.handlers.length - 1}
            />
          ))}
      </ul>
    </div>
  );
}

interface EventNodeHandlerComponentProps {
  handler: BrickEventHandler;
  isLast?: boolean;
}

function EventNodeHandlerComponent({
  handler,
  isLast,
}: EventNodeHandlerComponentProps): React.ReactElement {
  let icon: React.ReactElement;
  let title: string;
  let content: string;
  let handlerClassName: string;
  if (isBuiltinHandler(handler)) {
    icon = <FontAwesomeIcon icon="code" />;
    title = "action:";
    content = handler.action;
    handlerClassName = styles.handlerTypeOfBuiltin;
  } else if (isUseProviderHandler(handler)) {
    icon = <FontAwesomeIcon icon="database" />;
    title = "useProvider:";
    content = handler.useProvider;
    handlerClassName = styles.handlerTypeOfUseProvider;
  } else if (isExecuteHandler(handler)) {
    icon = <FontAwesomeIcon icon="wrench" />;
    title = `${handler.method}(…)`;
    content = (handler.target as string) || handler.targetRef;
    handlerClassName = styles.handlerTypeOfExecute;
  } else if (isSetPropsHandler(handler)) {
    icon = <FontAwesomeIcon icon="pen-square" />;
    title = "set properties:";
    content = (handler.target as string) || handler.targetRef;
    handlerClassName = styles.handlerTypeOfSetProps;
  } else {
    icon = <FontAwesomeIcon icon="question-circle" />;
    title = "unknown:";
    content = JSON.stringify(handler);
    handlerClassName = styles.handlerTypeOfUnknown;
  }
  return (
    <li
      className={`${styles.handler} ${handlerClassName}`}
      style={{
        ...styleConfig.item,
        marginBottom: isLast ? 0 : styleConfig.item.marginBottom,
      }}
    >
      <div className={styles.handlerIcon}>{icon}</div>
      <div className={styles.handlerBody}>
        <div className={styles.handlerTitle}>{title}</div>
        <div className={styles.handlerContent}>{content}</div>
      </div>
    </li>
  );
}

function isBuiltinHandler(
  handler: BrickEventHandler
): handler is BuiltinBrickEventHandler {
  return typeof (handler as BuiltinBrickEventHandler).action === "string";
}

function isUseProviderHandler(
  handler: BrickEventHandler
): handler is UseProviderEventHandler {
  return typeof (handler as UseProviderEventHandler).useProvider === "string";
}

function isExecuteHandler(
  handler: BrickEventHandler
): handler is ExecuteCustomBrickEventHandler {
  return !!(
    ((handler as CustomBrickEventHandler).target ||
      (handler as CustomBrickEventHandler).targetRef) &&
    (handler as ExecuteCustomBrickEventHandler).method
  );
}

function isSetPropsHandler(
  handler: BrickEventHandler
): handler is SetPropsCustomBrickEventHandler {
  return !!(
    ((handler as CustomBrickEventHandler).target ||
      (handler as CustomBrickEventHandler).targetRef) &&
    (handler as SetPropsCustomBrickEventHandler).properties
  );
}