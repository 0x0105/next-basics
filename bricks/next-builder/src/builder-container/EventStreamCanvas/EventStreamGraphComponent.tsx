/* istanbul ignore file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import {
  BuilderRuntimeNode,
  useBuilderData,
} from "@next-core/editor-bricks-helper";
import { EventStreamGraph } from "./EventStreamGraph";
import { buildBrickEventDownstreamTree } from "./buildBrickEventDownstreamTree";
import { buildBrickEventUpstreamTree } from "./buildBrickEventUpstreamTree";
import { useBuilderUIContext } from "../BuilderUIContext";
import { BuilderDataType } from "../interfaces";

export interface EventDownstreamGraphComponentProps {
  node: BuilderRuntimeNode;
}

export function EventDownstreamGraphComponent({
  node,
}: EventDownstreamGraphComponentProps): React.ReactElement {
  const { dataType, fullscreen, setEventStreamNodeId } = useBuilderUIContext();

  const eventDownstreamTree = React.useMemo(
    () => buildBrickEventDownstreamTree(node),
    [node]
  );

  const { nodes } = useBuilderData();
  const targetMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      for (const selector of n.$$matchedSelectors) {
        map.set(selector, n.id);
      }
    }
    return map;
  }, [nodes]);
  const targetRefMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (dataType === BuilderDataType.CUSTOM_TEMPLATE) {
      for (const n of nodes) {
        if (n.ref) {
          map.set(n.ref as string, n.id);
        }
      }
    }
    return map;
  }, [dataType, nodes]);

  const eventUpstreamTree = React.useMemo(
    () => buildBrickEventUpstreamTree(node, nodes),
    [node, nodes]
  );

  const visual = React.useMemo(() => new EventStreamGraph(), []);
  const ref = React.useRef<HTMLDivElement>(null);

  const resize = React.useCallback(() => {
    const graphContainer = ref.current;
    if (!graphContainer) {
      return;
    }
    let maxHeight = "100%";
    if (!fullscreen) {
      // Make the graph does not overflow the screen.
      const {
        top,
        bottom,
      } = graphContainer.parentElement.getBoundingClientRect();
      // The bottom spacing is the height of RootLayout subtract the bottom of the graph.
      const bottomSpacing =
        process.env.NODE_ENV === "test"
          ? 44 // For testing only
          : document.querySelector("#root-layout").getBoundingClientRect()
              .height - bottom;
      maxHeight = `${
        document.documentElement.clientHeight - top - bottomSpacing
      }px`;
    }
    graphContainer.style.maxHeight = maxHeight;
    graphContainer.style.height = maxHeight;
  }, [fullscreen]);

  React.useEffect(() => {
    const graphContainer = ref.current;
    if (!graphContainer) {
      return;
    }

    resize();
    graphContainer.appendChild(visual.getDOMNode());
  }, [visual, resize]);

  React.useEffect(() => {
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  const handleRender = React.useCallback(() => {
    visual.render(eventDownstreamTree, eventUpstreamTree, {
      targetMap,
      targetRefMap,
      setEventStreamNodeId,
    });
  }, [
    eventDownstreamTree,
    eventUpstreamTree,
    setEventStreamNodeId,
    targetMap,
    targetRefMap,
    visual,
  ]);

  React.useEffect(() => {
    handleRender();
  }, [handleRender]);

  return <div ref={ref} style={{ width: "100%", overflow: "hidden" }}></div>;
}
