import React from "react";
import {
  BuilderClipboard,
  BuilderDataType,
  ToolboxTab,
  BrickOptionItem,
} from "./interfaces";
import { BuilderRouteNode, BuilderCustomTemplateNode } from "@next-core/brick-types";

export interface ContextOfBuilderUI {
  appId?: string;
  dataType?: BuilderDataType;
  brickList?: BrickOptionItem[];
  processing?: boolean;
  fullscreen?: boolean;
  setFullscreen?: React.Dispatch<React.SetStateAction<boolean>>;
  toolboxTab?: ToolboxTab;
  setToolboxTab?: React.Dispatch<React.SetStateAction<ToolboxTab>>;
  eventStreamNodeId?: string;
  setEventStreamNodeId?: React.Dispatch<React.SetStateAction<string>>;
  clipboard?: BuilderClipboard;
  setClipboard?: React.Dispatch<React.SetStateAction<BuilderClipboard>>;
  onRouteSelect?: (route: BuilderRouteNode) => void;
  onTemplateSelect?: (template: BuilderCustomTemplateNode) => void;
  onCurrentRouteClick?: (route: BuilderRouteNode) => void;
  onCurrentTemplateClick?: (template: BuilderCustomTemplateNode) => void;
  onBuildAndPush?: () => void;
  onPreview?: () => void;
}

export const BuilderUIContext = React.createContext<ContextOfBuilderUI>({});

export function useBuilderUIContext(): ContextOfBuilderUI {
  return React.useContext(BuilderUIContext);
}
