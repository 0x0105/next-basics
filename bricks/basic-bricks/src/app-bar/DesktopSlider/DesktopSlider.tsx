import React, { useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { chunk } from "lodash";
import classNames from "classnames";
import { MicroApp, DesktopData, DesktopItem } from "@next-core/brick-types";
import { getHistory, getRuntime } from "@next-core/brick-kit";
import { Desktop } from "../Desktop/Desktop";
import { useLaunchpadSettingsContext } from "../LaunchpadSettingsContext";
import { useDesktopDirContext } from "../DesktopDirContext";
import styles from "./DesktopSlider.module.css";
import { MyDesktop } from "../MyDesktop/MyDesktop";
import { launchpadService } from "../LaunchpadService";

interface DesktopSliderProps {
  microApps: MicroApp[];
  q?: string;
  desktops?: DesktopData[];
  arrowWidthPercent: number;
}

// Open launchpad with the previous visited desktop.
let rememberedDesktopCursor = 0;

export function DesktopSlider(props: DesktopSliderProps): React.ReactElement {
  const enableMyDesktop = getRuntime().getFeatureFlags()["enable-my-desktop"];
  const [desktopCursor, setDesktopCursor] = React.useState(
    rememberedDesktopCursor
  );
  const [appCursor, setAppCursor] = React.useState(-1);
  const { columns, rows } = useLaunchpadSettingsContext();
  const { setDesktopDir } = useDesktopDirContext();
  const slideDuration = 400;

  useEffect(() => {
    enableMyDesktop && launchpadService.setMaxVisitorLength(columns);
  }, [columns, enableMyDesktop]);
  const mapAppsToDesktop = (apps: MicroApp[]): DesktopData => ({
    name: "-",
    items: apps.map((app) => ({
      type: "app",
      id: app.id,
      app,
    })),
  });

  let desktops: DesktopData[];
  let validApps = props.microApps;

  if (props.desktops && props.desktops.length > 0) {
    validApps = [];

    const id2app = props.microApps.reduce((acc, app) => {
      acc.set(app.id, app);
      return acc;
    }, new Map<string, MicroApp>());

    desktops = props.desktops
      .map((desktop) => ({
        name: desktop.name,
        items: desktop.items
          .map((item) => {
            if (item.type === "app") {
              if (id2app.has(item.id)) {
                const app = id2app.get(item.id);
                validApps.push(app);
                id2app.delete(item.id);
                return {
                  type: item.type,
                  id: item.id,
                  app,
                };
              }
              // ignore not found apps
            } else if (item.type === "dir") {
              const items = item.items
                .map((item) => {
                  if (item.type === "app") {
                    if (id2app.has(item.id)) {
                      const app = id2app.get(item.id);
                      validApps.push(app);
                      id2app.delete(item.id);
                      return {
                        type: item.type,
                        id: item.id,
                        app,
                      };
                    }
                  } else if (item.type === "custom") {
                    return item;
                  }
                })
                .filter(Boolean);
              // ignore empty dirs
              if (items.length > 0) {
                return {
                  type: item.type,
                  id: item.id,
                  name: item.name,
                  items,
                };
              }
            } else if (item.type === "custom") {
              return item;
            }
          })
          .filter(Boolean)
          .slice(0, columns * rows),
      }))
      // ignore empty desktops
      .filter((desktop) => desktop.items.length > 0);
  } else {
    // 如果没有定义桌面列表（例如本地开发模式），则自动按数量切割。
    desktops = chunk(props.microApps, columns * rows).map(mapAppsToDesktop);
  }
  let filteredDesktop: DesktopData;
  if (props.q) {
    const lowerQ = props.q.toLowerCase();
    filteredDesktop = mapAppsToDesktop(
      validApps
        .filter(
          (app) =>
            app.localeName.toLowerCase().includes(lowerQ) ||
            app.name.toLowerCase().includes(lowerQ) ||
            app.id.toLowerCase().includes(lowerQ)
        )
        .slice(0, columns * rows)
    );
  }

  // When sliding desktop, reset app cursor.
  React.useEffect(() => {
    setAppCursor(-1);
  }, [desktopCursor]);

  // When making search, set app cursor to the first app.
  React.useEffect(() => {
    setAppCursor(
      props.q && filteredDesktop && filteredDesktop.items.length > 0 ? 0 : -1
    );
  }, [props.q]);

  const lockRef = React.useRef(false);

  const throttledSetDesktopCursor = (index: number): void => {
    if (lockRef.current) {
      return;
    }
    !enableMyDesktop && (rememberedDesktopCursor = index);
    setDesktopCursor(index);
    // 一次滑动一个屏幕，锁定期间内，不能继续滑动屏幕。
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, slideDuration);
  };

  const slideLeft = React.useCallback((): void => {
    if (desktopCursor > 0) {
      throttledSetDesktopCursor(desktopCursor - 1);
    }
  }, [desktopCursor]);

  const slideRight = React.useCallback((): void => {
    const length = enableMyDesktop ? desktops.length : desktops.length + 1;
    if (desktopCursor < length) {
      throttledSetDesktopCursor(desktopCursor + 1);
    }
  }, [desktopCursor, desktops.length]);

  const handleSlideLeft = (e: React.MouseEvent): void => {
    e.stopPropagation();
    slideLeft();
  };

  const handleSlideRight = (e: React.MouseEvent): void => {
    e.stopPropagation();
    slideRight();
  };

  const handleSlideTo = (e: React.MouseEvent, index: number): void => {
    e.stopPropagation();
    if (desktopCursor !== index) {
      throttledSetDesktopCursor(index);
    }
  };

  // Press arrow key to select an app.
  React.useEffect(() => {
    const onKeydown = (event: KeyboardEvent): void => {
      const key =
        event.key ||
        /* istanbul ignore next: compatibility */ event.keyCode ||
        /* istanbul ignore next: compatibility */ event.which;
      const currentDesktop = props.q
        ? filteredDesktop
        : desktops[desktopCursor];
      if (key === "Enter" || key === 13) {
        event.preventDefault();
        if (appCursor >= 0 && appCursor < currentDesktop.items.length) {
          const cell = currentDesktop.items[appCursor];
          if (cell.type === "app") {
            getRuntime().resetWorkspaceStack();
            getHistory().push(cell.app.homepage);
          } else if (cell.type === "custom") {
            window.open(cell.url);
          } else if (cell.type === "dir") {
            // Calculate the approximate coordinates of a dir.
            const x = appCursor % columns;
            const y = Math.floor(appCursor / columns);
            setDesktopDir({
              activeIndex: 0,
              dir: {
                name: cell.name,
                items: cell.items,
              },
              coordinates: {
                x: (window.innerWidth * (x + 1)) / (columns + 1),
                y: (window.innerHeight * (y + 1)) / (rows + 1),
              },
            });
          }
        }
      } else {
        let offset = 0;
        if (key === "ArrowRight" || key === 39) {
          offset = 1;
        } else if (key === "ArrowLeft" || key === 37) {
          offset = appCursor === -1 ? currentDesktop.items.length : -1;
        } else if (key === "ArrowDown" || key === 40) {
          offset = appCursor === -1 ? 1 : columns;
        } else if (key === "ArrowUp" || key === 38) {
          offset = appCursor === -1 ? currentDesktop.items.length : -columns;
        }
        if (offset !== 0) {
          event.preventDefault();
          const next = appCursor + offset;
          if (next >= 0 && next < currentDesktop.items.length) {
            setAppCursor(next);
          }
        }
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [desktopCursor, appCursor, props.q, columns, setDesktopDir]);

  const deltaXRef = React.useRef(0);
  const deltaYRef = React.useRef(0);
  const responsibleRef = React.useRef(true);

  const tryToSlideByWheel = (): void => {
    // Mac 的 trackpad，部分鼠标滚轮会有“拖尾效应”，拖尾期间，不再响应滚轮事件。
    if (!responsibleRef.current) {
      return;
    }
    // 取绝对值较大的方向
    const axisRef =
      Math.abs(deltaYRef.current) > Math.abs(deltaXRef.current)
        ? deltaYRef
        : deltaXRef;
    // 经测试，滚轮纵轴一次位移 4，横轴一次位移 40。
    const threshold = axisRef === deltaYRef ? 4 : 40;
    if (axisRef.current >= threshold) {
      slideRight();
    } else if (axisRef.current <= -threshold) {
      slideLeft();
    } else {
      return;
    }
    // 触发滑动后，重设 delta，拖尾期间，不再响应滚轮事件。
    deltaXRef.current = 0;
    deltaYRef.current = 0;
    responsibleRef.current = false;
  };

  const resetDeltaTimeoutRef = React.useRef<any>();

  const handleWheel = (e: React.WheelEvent): void => {
    deltaXRef.current += e.deltaX;
    deltaYRef.current += e.deltaY;
    tryToSlideByWheel();
    if (resetDeltaTimeoutRef.current) {
      clearTimeout(resetDeltaTimeoutRef.current);
    }
    // 间隔 50ms 内的连续滚轮事件被认作一次滚动。
    resetDeltaTimeoutRef.current = setTimeout(() => {
      deltaXRef.current = 0;
      deltaYRef.current = 0;
      responsibleRef.current = true;
    }, 50);
  };

  const sliderChildrenLength = enableMyDesktop
    ? desktops.length + 1
    : desktops.length;

  return (
    <div
      className={classNames(styles.desktopSlider, {
        [styles.filtered]: props.q,
      })}
    >
      <div className={styles.desktopSelector}>
        {[...(enableMyDesktop ? [{ name: "我的" }] : []), ...desktops].map(
          (desktop, index) => (
            <React.Fragment key={index}>
              {index !== 0 && <span className={styles.selectorSeparator} />}
              <a
                className={classNames(styles.desktopName, {
                  [styles.active]: desktopCursor === index,
                })}
                onClick={(e) => handleSlideTo(e, index)}
                role="button"
              >
                {desktop.name}
              </a>
            </React.Fragment>
          )
        )}
      </div>
      <div className={styles.scrollContainer} onWheel={handleWheel}>
        <div
          className={styles.desktopList}
          style={{
            width: `${sliderChildrenLength * 100}%`,
            marginLeft: `${desktopCursor * -100}%`,
            transition: `margin-left ${slideDuration}ms ease-out`,
          }}
        >
          {enableMyDesktop && (
            <MyDesktop
              desktopCount={desktops.length}
              arrowWidthPercent={props.arrowWidthPercent}
            />
          )}
          {desktops.map((desktop, index) => (
            <Desktop
              key={index}
              desktop={desktop}
              desktopCount={desktops.length}
              arrowWidthPercent={props.arrowWidthPercent}
              activeIndex={desktopCursor === index ? appCursor : -1}
            />
          ))}
        </div>
        {
          // Show filtered apps as a single desktop.
          props.q && (
            <div className={styles.filteredList}>
              <Desktop
                desktop={filteredDesktop}
                desktopCount={1}
                arrowWidthPercent={props.arrowWidthPercent}
                activeIndex={appCursor}
              />
            </div>
          )
        }
      </div>
      <a
        className={classNames(styles.arrowLeft, {
          [styles.available]: desktopCursor > 0,
        })}
        style={{ width: `${props.arrowWidthPercent}%` }}
        onClick={handleSlideLeft}
        role="button"
      >
        <span className={styles.arrowButton}>
          <LeftOutlined />
        </span>
      </a>
      <a
        className={classNames(styles.arrowRight, {
          [styles.available]: desktopCursor < sliderChildrenLength - 1,
        })}
        style={{ width: `${props.arrowWidthPercent}%` }}
        onClick={handleSlideRight}
        role="button"
      >
        <span className={styles.arrowButton}>
          <RightOutlined />
        </span>
      </a>
    </div>
  );
}
