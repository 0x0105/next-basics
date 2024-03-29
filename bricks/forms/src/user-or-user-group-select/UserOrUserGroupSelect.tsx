import React, {
  useState,
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Select, Button, Divider } from "antd";
import styles from "./UserOrUserGroupSelect.module.css";
import { InstanceApi } from "@next-sdk/cmdb-sdk";
import {
  zipObject,
  map,
  debounce,
  startsWith,
  filter,
  reject,
  isNil,
  uniqBy,
  uniq,
  find,
  isEmpty,
  isEqual,
  groupBy,
  compact,
  some,
} from "lodash";
import { FormItemWrapperProps, FormItemWrapper } from "@next-libs/forms";
import { getInstanceNameKeys } from "@next-libs/cmdb-utils";
import { InstanceListModal } from "@next-libs/cmdb-instances";
import { getAuth } from "@next-core/brick-kit";
import { GeneralIcon } from "@next-libs/basic-components";

export type UserOrUserGroupSelectValue = {
  selectedUser: string[];
  selectedUserGroup: string[];
};

export interface UserSelectFormItemProps {
  children?: ReactNode;
  objectMap?: Record<string, any>;
  onChange?: (value: any) => void;
  placeholder?: string;
  value?: UserOrUserGroupSelectValue;
  hideAddMeQuickly?: boolean;
  hideSelectByCMDB?: boolean;
  optionsMode: "user" | "group" | "all";
  staticList?: string[];
  mergeUseAndUserGroup?: boolean;
  query?: Record<string, any>;
  hideInvalidUser?: boolean;
}

interface UserOrUserGroupSelectProps extends FormItemWrapperProps {
  objectMap: Record<string, any>;
  placeholder?: string;
  value?: UserOrUserGroupSelectValue;
  hideAddMeQuickly?: boolean;
  hideSelectByCMDB?: boolean;
  onChange?: (value: any) => void;
  optionsMode: "user" | "group" | "all";
  staticList?: string[];
  mergeUseAndUserGroup?: boolean;
  query?: Record<string, any>;
  hideInvalidUser?: boolean;
}

export function LegacyUserSelectFormItem(
  props: UserSelectFormItemProps,
  ref: React.Ref<HTMLDivElement>
): React.ReactElement {
  const selectRef = useRef();
  const [selectedValue, setSelectedValue] = useState([]);
  const staticValue = useRef([]);
  const userShowKey: string[] = getInstanceNameKeys(props.objectMap["USER"]);
  const userGroupShowKey: string[] = getInstanceNameKeys(
    props.objectMap["USER_GROUP"]
  );
  const getLabel = (
    objectId: "USER" | "USER_GROUP",
    instanceData: any
  ): string => {
    const showKey = objectId === "USER" ? userShowKey : userGroupShowKey;
    if (Array.isArray(showKey)) {
      const showName = showKey
        .map((key, index) => {
          if (index === 0) {
            return instanceData[key];
          } else {
            return instanceData[key] ? "(" + instanceData[key] + ")" : "";
          }
        })
        .join("");
      return showName;
    } else {
      return instanceData[showKey];
    }
  };

  const getStaticLabel = (label: string) => (
    <div style={{ color: "var(--bg-color-button-link)" }}>{label}</div>
  );

  const isDifferent = () => {
    const userOfValues = props.value?.selectedUser || [];
    const userGroupOfValues = props.value?.selectedUserGroup || [];
    const userOfSelectedValue = map(
      filter(selectedValue, (item) => !item.key.startsWith(":")),
      "key"
    );
    const userGroupOfSelectedValue = map(
      filter(selectedValue, (item) => item.key.startsWith(":")),
      "key"
    );
    return (
      !isEqual([...userOfValues].sort(), [...userOfSelectedValue].sort()) ||
      !isEqual(
        [...userGroupOfValues].sort(),
        [...userGroupOfSelectedValue].sort()
      )
    );
  };

  const initializeStaticList = () => {
    return groupBy(props.staticList, (v) =>
      startsWith(v, ":") ? "userGroup" : "user"
    );
  };

  // 后台搜索中
  const [fetching, setFetching] = useState(false);

  const [searchValue, setSearchValue] = useState();
  const [userList, setUserList] = useState([]);
  const [userGroupList, setUserGroupList] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalObjectId, setModalObjectId] = useState(
    props.optionsMode === "group" ? "USER_GROUP" : "USER"
  );

  const triggerChange = (changedValue: any) => {
    props.onChange?.(
      isEmpty(changedValue.selectedUser) &&
        isEmpty(changedValue.selectedUserGroup)
        ? null
        : changedValue
    );
  };

  useEffect(() => {
    const initializeSelectedValue = async () => {
      if (props.value) {
        let selectedUser: any[] = [];
        let selectedUserGroup: any[] = [];
        const staticKeys = initializeStaticList();
        const user = compact(
          uniq([].concat(staticKeys.user).concat(props.value.selectedUser))
        );
        const userGroup = compact(
          uniq(
            []
              .concat(staticKeys.userGroup)
              .concat(props.value.selectedUserGroup)
          )
        );
        if (
          (staticKeys.user &&
            some(
              staticKeys.user,
              (v) => !props.value?.selectedUser?.includes(v)
            )) ||
          (staticKeys.userGroup &&
            some(
              staticKeys.userGroup,
              (v) => !props.value?.selectedUserGroup?.includes(v)
            ))
        ) {
          triggerChange({
            selectedUser: user,
            selectedUserGroup: userGroup,
          });
        }
        const staticValueToSet = [];
        if (user.length && props.optionsMode !== "group") {
          selectedUser = (
            await InstanceApi.postSearch("USER", {
              query: {
                name: {
                  $in: user,
                },
              },
              page: 1,
              page_size: user.length,
              fields: {
                ...zipObject(
                  userShowKey,
                  map(userShowKey, (v) => true)
                ),
                name: true,
              },
            })
          ).list;
        }
        if (userGroup.length && props.optionsMode !== "user") {
          selectedUserGroup = (
            await InstanceApi.postSearch("USER_GROUP", {
              query: {
                instanceId: {
                  // 默认带为":"+instanceId，这里查询的时候去掉前面的冒号
                  $in: map(userGroup, (v) => v.slice(1)),
                },
              },
              page: 1,
              page_size: userGroup.length,
              fields: {
                ...zipObject(
                  userGroupShowKey,
                  map(userGroupShowKey, (v) => true)
                ),
                name: true,
              },
            })
          ).list;
        }
        let labelValue = [
          ...map(selectedUser, (v) => {
            const labelText = getLabel("USER", v);
            const result = {
              key: v.name,
              label: props.staticList?.includes(v.name)
                ? getStaticLabel(labelText)
                : labelText,
            };
            if (props.staticList?.includes(v.name)) {
              staticValueToSet.push(result);
            }
            return result;
          }),
          ...map(selectedUserGroup, (v) => {
            const labelText = getLabel("USER_GROUP", v);
            const result = {
              key: ":" + v.instanceId,
              label: props.staticList?.includes(":" + v.instanceId)
                ? getStaticLabel(labelText)
                : labelText,
            };
            if (props.staticList?.includes(":" + v.instanceId)) {
              staticValueToSet.push(result);
            }
            return result;
          }),
        ];
        labelValue = [
          ...staticValueToSet,
          ...filter(labelValue, (v) => !props.staticList?.includes(v.key)),
        ];
        setSelectedValue(labelValue);
        staticValue.current = staticValueToSet;
      }
    };
    if (isDifferent()) {
      initializeSelectedValue();
    }
  }, [props.value]);

  const fetchInstanceList = async (
    objectId: "USER" | "USER_GROUP",
    keyword: string
  ) => {
    const showKey = objectId === "USER" ? userShowKey : userGroupShowKey;
    return (
      await InstanceApi.postSearch(objectId, {
        page: 1,
        page_size: 20,
        fields: {
          ...zipObject(
            showKey,
            map(showKey, (v) => true)
          ),
          name: true,
        },
        query: props.query
          ? props.query
          : {
              $or: map(uniq([...showKey, "name"]), (v) => ({
                [v]: { $like: `%${keyword}%` },
              })),
              ...(props.hideInvalidUser
                ? {
                    state: "valid",
                  }
                : {}),
            },
      })
    ).list;
  };

  const searchUser = async (value: string) => {
    setUserList(await fetchInstanceList("USER", value));
  };

  // 用户组在instanceId前面加上:
  const searchUserGroup = async (value: string) => {
    const result = await fetchInstanceList("USER_GROUP", value);
    setUserGroupList(
      result.map((v) => {
        v.instanceId = ":" + v.instanceId;
        return v;
      })
    );
  };

  const searchUserOrUserGroupInstances = async (value) => {
    setSearchValue(value);
    setFetching(true);
    await Promise.all([
      ...(props.optionsMode !== "group" ? [searchUser(value)] : []),
      ...(props.optionsMode !== "user" ? [searchUserGroup(value)] : []),
    ]);
    setFetching(false);
  };

  const handleSelectChange = (originValue) => {
    const value = filter(originValue, (item) => {
      return !find(props.staticList, (v) => v === item.key);
    });
    value.unshift(...staticValue.current);
    setSelectedValue(value);
    const resultValue = {
      selectedUser: map(
        reject(value, (v) => {
          return startsWith(v.key, ":");
        }),
        "key"
      ),
      selectedUserGroup: map(
        filter(value, (v) => {
          return startsWith(v.key, ":");
        }),
        "key"
      ),
    };
    triggerChange(resultValue);
    if (searchValue !== "") {
      searchUserOrUserGroupInstances("");
    }
  };

  const handleFocus = () => {
    if (isNil(searchValue) || searchValue !== "") {
      searchUserOrUserGroupInstances("");
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleInstancesSelected = (
    value: Record<string, any>[],
    objectId: string
  ): void => {
    let labelValue: any[] = [];
    if (objectId === "USER") {
      labelValue = [
        ...map(value, (v) => {
          const labelText = getLabel("USER", v);
          return {
            key: v.name,
            label: props.staticList?.includes(v.name)
              ? getStaticLabel(labelText)
              : labelText,
          };
        }),
      ];
    } else {
      labelValue = [
        ...map(value, (v) => {
          const labelText = getLabel("USER_GROUP", v);
          return {
            key: ":" + v.instanceId,
            label: props.staticList?.includes(":" + v.instanceId)
              ? getStaticLabel(labelText)
              : labelText,
          };
        }),
      ];
    }
    const resultSelectedValue = uniqBy(
      [...selectedValue, ...labelValue],
      "key"
    );
    setSelectedValue(resultSelectedValue);
    const resultValue = {
      selectedUser: map(
        reject(resultSelectedValue, (v) => {
          return startsWith(v.key, ":");
        }),
        "key"
      ),
      selectedUserGroup: map(
        filter(resultSelectedValue, (v) => {
          return startsWith(v.key, ":");
        }),
        "key"
      ),
    };
    triggerChange(resultValue);
  };

  const handleModalSelected = async (selectedKeys: string[]) => {
    if (selectedKeys?.length) {
      const instances = (
        await InstanceApi.postSearch(modalObjectId, {
          query: { instanceId: { $in: selectedKeys } },
          fields: { "*": true },
          page_size: selectedKeys.length,
        })
      ).list;
      handleInstancesSelected(instances, modalObjectId);
    }
    setModalVisible(false);
  };

  const toggleObjectId = () => {
    setModalObjectId(modalObjectId === "USER" ? "USER_GROUP" : "USER");
  };

  const title = (
    <div>
      从 CMDB 中筛选{modalObjectId === "USER" ? "用户" : "用户组"}{" "}
      {props.optionsMode === "all" && (
        <Button type="link" onClick={toggleObjectId}>
          切换{modalObjectId === "USER" ? "用户组" : "用户"}{" "}
        </Button>
      )}
    </div>
  );

  // 快速选择我
  const addMeQuickly = async () => {
    const myUserName = getAuth().username;
    if (find(selectedValue, (v) => v.key === myUserName)) {
      // 如果已选择项中包含我，则不重新发起请求
      return;
    }
    const myUser = (
      await InstanceApi.postSearch("USER", {
        query: {
          name: {
            $eq: myUserName,
          },
        },
        page: 1,
        page_size: 1,
        fields: {
          ...zipObject(
            userShowKey,
            map(userShowKey, (v) => true)
          ),
          name: true,
        },
      })
    ).list;
    handleInstancesSelected(myUser, "USER");
  };

  const getRight = () => {
    const btnWidth =
      !props.hideAddMeQuickly && props.optionsMode !== "group" ? -34 : 0;
    const lineWidth =
      !props.hideAddMeQuickly &&
      props.optionsMode !== "group" &&
      !props.hideSelectByCMDB
        ? -1
        : 0;
    const iconWidth = props.hideSelectByCMDB ? 0 : -32;
    return btnWidth + lineWidth + iconWidth;
  };

  return (
    <div
      ref={ref}
      data-testid="wrapper"
      className={styles.UserOrUserGroupSelectContainer}
    >
      <Select
        className={styles.customSelect}
        ref={selectRef}
        allowClear={true}
        mode="multiple"
        labelInValue
        placeholder={props.placeholder}
        filterOption={false}
        value={selectedValue}
        onChange={handleSelectChange}
        onSearch={debounce((value) => {
          searchUserOrUserGroupInstances(value as string);
        }, 500)}
        onFocus={handleFocus}
        style={{ width: "100%" }}
        loading={fetching}
      >
        {props.optionsMode !== "group" && (
          <Select.OptGroup label="用户（仅显示前20项，更多结果请搜索）">
            {userList.length > 0 ? (
              userList.map((d) => (
                <Select.Option value={d.name} key={d.name}>
                  {props.staticList?.includes(d.name)
                    ? getStaticLabel(getLabel("USER", d))
                    : getLabel("USER", d)}
                </Select.Option>
              ))
            ) : (
              <Select.Option value="empty-user" key="empty-user" disabled>
                暂无数据
              </Select.Option>
            )}
          </Select.OptGroup>
        )}
        {props.optionsMode !== "user" && (
          <Select.OptGroup label="用户组（仅显示前20项，更多结果请搜索）">
            {userGroupList.length > 0 ? (
              userGroupList.map((d) => (
                <Select.Option value={d.instanceId} key={d.instanceId}>
                  {props.staticList?.includes(d.instanceId)
                    ? getStaticLabel(getLabel("USER_GROUP", d))
                    : getLabel("USER_GROUP", d)}
                </Select.Option>
              ))
            ) : (
              <Select.Option
                value="empty-user-group"
                key="empty-user-group"
                disabled
              >
                暂无数据
              </Select.Option>
            )}
          </Select.OptGroup>
        )}
      </Select>
      <div className={styles.extra} style={{ right: getRight() }}>
        {!props.hideAddMeQuickly && props.optionsMode !== "group" && (
          <Button
            type="link"
            onClick={addMeQuickly}
            style={{ fontSize: "16px" }}
          >
            <GeneralIcon icon={{ lib: "easyops", icon: "quick-add-me" }} />
          </Button>
        )}
        {!props.hideAddMeQuickly &&
          props.optionsMode !== "group" &&
          !props.hideSelectByCMDB && <Divider type="vertical" />}
        {!props.hideSelectByCMDB && (
          <Button
            type="link"
            icon={<SearchOutlined />}
            onClick={openModal}
          ></Button>
        )}
      </div>
      <InstanceListModal
        objectMap={props.objectMap}
        objectId={modalObjectId}
        visible={modalVisible}
        title={title}
        onSelected={handleModalSelected}
        onCancel={closeModal}
        {...(modalObjectId === "USER" && props.hideInvalidUser
          ? {
              presetConfigs: {
                query: {
                  state: "valid",
                },
              },
            }
          : {})}
      />
    </div>
  );
}

export const UserSelectFormItem = forwardRef<HTMLDivElement>(
  LegacyUserSelectFormItem
);

export function UserOrUserGroupSelect(
  props: UserOrUserGroupSelectProps
): React.ReactElement {
  return (
    <FormItemWrapper {...props}>
      <UserSelectFormItem
        objectMap={props.objectMap}
        placeholder={props.placeholder}
        value={props.value}
        hideAddMeQuickly={props.hideAddMeQuickly}
        hideSelectByCMDB={props.hideSelectByCMDB}
        onChange={props.onChange}
        optionsMode={props.optionsMode}
        staticList={props.staticList}
        mergeUseAndUserGroup={props.mergeUseAndUserGroup}
        query={props.query}
        hideInvalidUser={props.hideInvalidUser}
      />
    </FormItemWrapper>
  );
}
