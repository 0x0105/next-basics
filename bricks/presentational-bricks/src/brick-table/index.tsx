import React from "react";
import ReactDOM from "react-dom";
import {
  BrickWrapper,
  property,
  UpdatingElement,
  event,
  EventEmitter,
  method,
} from "@next-core/brick-kit";
import { NS_PRESENTATIONAL_BRICKS, K } from "../i18n/constants";
import i18n from "i18next";
import paginationStyle from "../general-pagination/index.module.css";
import { BrickTable } from "./BrickTable";
import {
  get,
  map,
  set,
  isEmpty,
  merge,
  orderBy,
  isNil,
  forEach,
  cloneDeep,
  isArray,
  uniqBy,
  uniq,
  pullAllBy,
  pullAll,
  every,
  find,
  pull,
  filter,
  flatten,
} from "lodash";
import { TablePaginationConfig, TableProps } from "antd/lib/table";
import { TableRowSelection, SorterResult } from "antd/lib/table/interface";
import {
  compareFunMap,
  getKeysOfData,
  getRowsOfData,
  stripEmptyExpandableChildrenByName,
} from "./brickTableHelper";
import { getHistory } from "@next-core/brick-kit";
import { BrickEventsMap, UseBrickConf } from "@next-core/brick-types";
import { SortOrder } from "antd/lib/table/interface";
import { ColumnProps } from "antd/lib/table";
import { MenuIcon } from "@next-core/brick-types";
import { BrickWrapperConfig } from "../interfaces";
export interface RowDisabledProps {
  field: string;
  value: any;
  operator: "$eq" | "$ne" | "$lt" | "$lte" | "$gt" | "$gte";
}

export interface CustomColumnComponent {
  brick: string | any;
  fields?: {
    value?: string;
    item?: string;
    index?: string;
  };
  properties?: Record<string, any>;
  events?: BrickEventsMap;
}

export interface CustomColumn extends ColumnProps<Record<string, any>> {
  /**
   * 支持为某列自定义展示构件
   */
  useBrick?: UseBrickConf;
  /**
   * 字段的值展示时的后缀
   */
  valueSuffix?: string;
  /**
   * 支持为某列的表头自定义展示构件，可通过 DATA.title 获取标题文本
   */
  headerBrick?: {
    useBrick: UseBrickConf;
  };
  /**
   * 在渲染自定义构件的场景下额外设置单元格的状态样式， `dataIndex` 表示取哪一列的字段值作为判断数据，不填的话默认取当前列的字段，`mapping` 表示判断的条件，条件被成功匹配时用当前的样式。目前仅支持单元格 `leftBorderColor` 属性的设置
   */
  cellStatus?: CellStatusProps;
  /**
   * [已废弃]支持为某列的标题自定义展示构件，可通过 DATA.title 获取标题文本
   */
  titleUseBrick?: UseBrickConf;
  /**
   * [已废弃]支持为某列自定义展示构件
   */
  component?: CustomColumnComponent;
  /**
   * 单元格内元素的垂直对齐方式
   */
  verticalAlign?: "top" | "bottom";
}

export interface CellStatusProps {
  dataIndex?: string;
  mapping: Array<{
    leftBorderColor: string;
    value: any;
  }>;
}

/**
 * @id presentational-bricks.brick-table
 * @name presentational-bricks.brick-table
 * @docKind brick
 * @description 当需要对数据进行排序、搜索、分页、自定义操作等复杂行为时
 * @author lynette
 * @slots
 * @history
 * 1.168.0:新增属性 `optimizedColumns`
 * 1.153.0:`columns` 属性新增 `headerBrick`、废弃 `titleUseBrick`
 * 1.145.0:新增`stripEmptyExpandableChildren`属性
 * 1.143.0:新增属性 `selectedRowKeys`
 * 1.111.0:新增属性 `sortable`
 * 1.105.0:新增属性 `zebraPattern` ，`columns` 属性新增 `titleUseBrick`
 * 1.102.0:新增属性`hiddenColumns`
 * 1.94.0:新增属性`tableDraggable`，预废弃属性 `draggable`
 * 1.92.0:新增属性 `filters`
 * 1.72.0:新增属性 `draggable`，新增事件`row.drag`
 * 1.70.0:新增 `qField` 属性
 * 1.68.0:新增属性 `childrenColumnName`、`selectAllChildren`
 * 1.67.0:新增 `rowKey` 属性
 * 1.63.0:新增行展开功能，新增属性`expandedRowBrick`,`expandedRowBrick`,`expandIconAsCell`,`expandIconColumnIndex`,`expandRowByClick`,`defaultExpandAllRows`,`expandedRowKeys`，新增事件`row.expand`,`expand.rows.change`
 * 1.60.0:新增 `cellStatus` 属性
 * 1.59.0:新增 `rowDisabledConfig` 属性
 * 1.57.1:新增 `shouldUpdateUrlParams` 属性和 `sort.update` 事件
 * @memo
 * > Tips: 在 react 中，boolean 类型的值是合法的子元素，但是不会被渲染出来。如果希望 boolean 值在表格单元格中展示成 `true`|`false`，可以使用平台管道进行转换，例如`@{someProperties|string}`。更多场景下可以结合 [基本数值映射构件](developers/brick-book/brick/presentational-bricks.brick-value-mapping) 把 boolean 类型的值转换成有意义的文本进行展示。
 *
 * ## dataSource 表格数据源
 * | property      | type           | required | default | description                                        |
 * | ------------- | -------------- | -------- | ------- | -------------------------------------------------- |
 * | dataSource            | any                                                                              | -        | -        | 数据源，通过 useResolves 从后台接口获取或者直接在 storyboard 中配置           |
 *
 * ## columns 表格列配置
 * | property      | type           | required | default | description                                        |
 * | ------------- | -------------- | -------- | ------- | -------------------------------------------------- |
 * | columns               | CustomColumn[]      | -        | -        | 扩展自 ant-design 的 Column 相关配置项,具体查阅：[https://ant.design/components/table-cn/#Column](https://ant.design/components/table-cn/#Column)                                                                                                                         |
 *
 * ### CustomColumn
 * | property             | type                  | required | default | description                                                    |
 * | -------------------- | --------------------- | -------- | ------- | -------------------------------------------------------------- |
 * | <del>component</del> | CustomColumnComponent | -        | -       | Deprecated。支持为某列自定义展示构件                           |
 * | valueSuffix          | string                | -        | -       | 字段的值展示时的后缀                                           |
 * | useBrick             | UseBrickConf          | -        | -       | 支持为某列自定义展示构件                                       |
 * | titleUseBrick        | UseBrickConf          | -        | -       | 支持为某列的标题自定义展示构件，可通过 DATA.title 获取标题文本 |
 * | filters | {text:string,value:any}[] | - | - | 表头的筛选菜单项 |
 * | verticalAlign | `top` &#124; `bottom` | - | - | 单元格内元素的垂直对齐方式 |
 *
 * ### UseBrickConf
 *
 * | property      | type           | required | default | description                                        |
 * | ------------- | -------------- | -------- | ------- | -------------------------------------------------- |
 * | brick         | string         | ✔️       | -       | 构件名称                                           |
 * | properties    | object         | -        | -       | 构件属性                                           |
 * | events        | BrickEventsMap | -        | -       | 事件                                               |
 * | transform     | string\|object | -        | -       | 属性数据转换                                       |
 * | transformFrom | string         | -        | -       | 属性数据转换来自数据源的哪个字段，不填则为整个数据 |
 *
 * `<presentational-bricks.brick-table>` 为某列自定义展示构件传递的数据源为：
 *
 * | field       | type   | description |
 * | ----------- | ------ | ----------- |
 * | cellData    | any    | 单元格数据  |
 * | rowData     | any    | 整行数据    |
 * | columnIndex | number | 列序号      |
 *
 * `<presentational-bricks.brick-table>` 为自定义行展开的构件传递的数据源为：
 *
 * | field    | type   | description |
 * | -------- | ------ | ----------- |
 * | rowData  | any    | 整行数据    |
 * | rowIndex | number | 行序号      |
 *
 * ### <del>CustomColumnComponent</del>
 *
 * <details>
 * <summary>展开</summary>
 *
 * | property   | type                                         | required | default | description                                     |
 * | ---------- | -------------------------------------------- | -------- | ------- | ----------------------------------------------- |
 * | brick      | string                                       | ✔️       | -       | 构件名称                                        |
 * | fields     | {value: string; item: string; index: string} | ✔️       | -       | 字段值、列表项和 index 对应所用构件的属性的 key |
 * | properties | object                                       | -        | -       | 构件属性                                        |
 * | events     | BrickEventsMap                               | -        | -       | 事件                                            |
 *
 * </details>
 *
 * ### fields
 * | property   | type   | required | default  | description                                                                                              |
 * | ---------- | ------ | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
 * | fields                | fieldsType                                                                           | -        | -        | 设置相关字段取自哪里，具体描述见下表      |
 *
 * ### fieldsType
 * | property   | type   | required | default  | description                                                                                              |
 * | ---------- | ------ | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
 * | dataSource | string | -        | list     | 指定 dataSource 从哪里来，默认为列表接口返回格式是{list:[],page:1,pageSize:10,total:20}，即默认取自 list |
 * | total      | string | -        | total    | 指定 total 从哪里来，默认为列表接口返回格式是{list:[],page:1,pageSize:10,total:20}，即默认取自 total     |
 * | page       | string | -        | page     | 指定下表中 "page.update" 事件 detail 的 pagePath                                                         |
 * | pageSize   | string | -        | pageSize | 指定下表 "filter.update" 事件 detail 的 pageSizePath                                                     |
 * | ascend     | string | -        | ascend   | 指定 ascend 升序排序对应字段，例如有些后台对应为 1 ，有些对应为 "asc"。这里默认为 "ascend"               |
 * | descend    | string | -        | descend  | 指定 descend 降序排序对应字段，例如有些后台对应为 0 ，有些对应为 "desc"。这里默认为 "descend"            |
 *
 * ### pagination 默认配置
 *
 * 如果不希望分页，只需在 storyboard 中如下设置即可：
 *
 * ```
 * {
 *   "configProps": {
 *     "pagination": false
 *   }
 * }
 * ```
 *
 * 如果希望覆盖默认配置，只需在 storyboard 中覆盖对应项即可，相关配置项具体查阅：<a href="https://ant.design/components/pagination-cn/#API" target="_blank">https://ant.design/components/pagination-cn/#API</a>：
 *
 * ```
 * {
 *   "configProps": {
 *     "pagination": {
 *       "pageSizeOptions": ["10","100","1000"]
 *     }
 *   }
 * }
 * ```
 *
 * | property        | type     | required | default            | description                           |
 * | --------------- | -------- | -------- | ------------------ | ------------------------------------- |
 * | current         | string   | -        | -                  | 页码，从 page properties 获取         |
 * | pageSize        | string   | -        | -                  | 每页条数，从 pageSize properties 获取 |
 * | total           | object   | -        | -                  | 总数，从 dataSource.total 获取        |
 * | showSizeChanger | boolean  | -        | true               | 展示页码变化器                        |
 * | pageSizeOptions | array    | -        | ["10", "20", "50"] | 每页条数选项                          |
 * | showTotal       | function | -        | -                  | 渲染成"共 xx 条"                      |
 *
 *
 * ### rowSelection 默认配置
 *
 * 行选择默认为 false，即如果不在 storyboard 中配置就不显示。如果要开启只需在 storyboard 中如下设置即可，这时 brick-table 会默认配置 onChange 事件：
 *
 * ```
 * {
 *   "configProps": {
 *     "rowSelection": true
 *   }
 * }
 * ```
 *
 * 如果希望覆盖或者扩展默认配置，只需在 storyboard 中覆盖对应项即可，相关配置项具体查阅：<a href="https://ant.design/components/table-cn/#rowSelection" target="_blank">https://ant.design/components/table-cn/#rowSelection</a>：
 *
 * ```
 * {
 *   "configProps": {
 *     "rowSelection": {
 *       "columnWidth": "88px"
 *     }
 *   }
 * }
 * ```
 *
 * | property | type     | required | default | description                       |
 * | -------- | -------- | -------- | ------- | --------------------------------- |
 * | onChange | function | -        | -       | 选择行，会抛出事件"select.update" |
 *
 * ### 排序
 *
 * 如果某一列希望排序，则可以设对应列 `sorter:true`，例如：
 *
 * ```
 * {
 *   "columns": [
 *     {
 *       "title": "主机",
 *       "key": "hostname",
 *       "dataIndex": "hostname",
 *       "sorter": true
 *     }
 *   ]
 * }
 * ```
 *
 * @noInheritDoc
 */
export class BrickTableElement extends UpdatingElement {
  /**
   * @default -
   * @required false
   * @description 设置容器空状态时显示`empty`构件属性
   */
  @property({ attribute: false })
  wrapperConfig: BrickWrapperConfig = {};

  /**
   * @detail {[pagePath]: xxx}
   * @description 页码变化,pagePath 可在 fields.page 中设置，默认为 page
   */
  @event({ type: "page.update" }) pageUpdate: EventEmitter<
    Record<string, number>
  >;

  /**
   * @detail {[pagePath]:1,[pageSizePath]:xxx}
   * @description 每页条数变化 ,pagePath 可在 fields.page 中设置,pageSizePath 可在 fields.pageSize 中设置，默认为 pageSize
   */
  @event({ type: "filter.update" }) filterUpdate: EventEmitter<
    Record<string, number>
  >;

  /**
   * @detail Record<string,any>[]
   * @description 勾选框变化，detail 中为所选的行数据
   */
  @event({ type: "select.update" }) selectUpdate: EventEmitter<
    Record<string, any>[]
  >;

  /**
   * @detail {sort:string;order:string|number}
   * @description 排序变化，detail 中的 sort 为对应排序列的 key/dataIndex，order 为升序/降序
   */
  @event({ type: "sort.update", cancelable: true }) sortUpdate: EventEmitter<{
    sort: string;
    order: string | number;
  }>;

  /**
   * @detail {expanded:boolean;record:Record<string,any>}
   * @description 点击展开图标时触发的事件，事件详情中`expanded`为是否展开，`record`被点击的行信息
   */
  @event({ type: "row.expand" }) rowExpand: EventEmitter<{
    expanded: boolean;
    record: Record<string, any>;
  }>;

  /**
   * @detail {expandedRows:string[]| number[]}
   * @description 展开的行变化时触发的事件，事件详情为当前展开的所有行的`rowKey`集合
   */
  @event({ type: "expand.rows.change" }) expandRowsChange: EventEmitter<{
    expandedRows: React.Key[];
  }>;

  /**
   * @detail {data:Record<string,any>[]}
   * @description 表格行拖拽结束发生的事件，事件详情为拖拽后重新排序的所有行数据
   */
  @event({ type: "row.drag" }) rowDrag: EventEmitter<{
    data: Record<string, any>[];
  }>;

  /**
   * @kind (string|number)[]
   * @required false
   * @default -
   * @description 隐藏相应列（输入对应的 dataIndex 或者 key 即可）
   */
  @property({
    attribute: false,
  })
  hiddenColumns: Array<string | number>;

  /**
   * @kind (string|number)[]
   * @required false
   * @default -
   * @description 优化渲染的列（输入对应的 dataIndex），针对配置了 useBrick 的列。当前 antd 在更新 state 的时候，会全量渲染单元格，如果确定某一列在后续操作中不需要重新渲染，例如仅作为展示的单元格，可通过该属性设置以优化性能。注意，在树形表格中，当某一列内包含展开/收起按钮，则不应该设置该列。
   */
  @property({
    attribute: false,
  })
  optimizedColumns: Array<string | number>;

  /**
   * @required false
   * @default false
   * @description 树形数据展示时是否需要去除空数组
   */
  @property({
    attribute: false,
  })
  stripEmptyExpandableChildren = false;

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 是否更新 url 参数。设置为否之后，如果是后台进行分页/排序等功能，则需要结合事件进行编排。如果是前台进行分页/排序，则不需要。
   */
  @property({
    attribute: false,
  })
  shouldUpdateUrlParams = true;

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 更新 url 参数时是否触发页面重新渲染。仅在`shouldUpdateUrlParams`为true时有效。
   */
  @property({
    attribute: false,
  })
  shouldRenderWhenUrlParamsUpdate = true;

  /**
   * @kind boolean
   * @required false
   * @default `false`
   * @description 是否显示已选择信息和清除按钮。仅在设置了`configProps.rowSelection`时有效。默认不显示
   */
  @property({
    attribute: false,
  })
  showSelectInfo = false;

  /**
   * @kind number
   * @required false
   * @default -
   * @description 页码。后台搜索的时候一般不需要配置，列表接口返回格式通常为{list:[],page:1,pageSize:10,total:20}，即默认取自 page；前台搜索的时候，一般配置成 "${query.page=1|number}"
   */
  @property({
    attribute: false,
  })
  page: number;

  /**
   * @kind number
   * @required false
   * @default -
   * @description 页码条数。后台搜索的时候一般不需要配置，列表接口返回格式通常为{list:[],page:1,pageSize:10,total:20}，即默认取自 pageSize/page_size；前台搜索的时候，一般配置成 "${query.pageSize=10|number}"
   */
  @property({
    attribute: false,
  })
  pageSize: number;

  // 表头过滤的 filters
  /**
   * @kind Record<string,string[]>
   * @required false
   * @default -
   * @description 表头过滤的过滤项，key 为 column 的 dataIndex，value 为过滤值集合。
   */
  @property({
    attribute: false,
  })
  filters: Record<string, string[]>;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 被排序列的 dataIndex。通常来自于 url 参数，可以设置成 ${QUERY.sort}。
   */
  @property()
  sort: string;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 指定每一行的 key，不指定则默认为索引 index。强烈建议设置该属性，否则在某些情况下可能行为不如预期。
   */
  @property()
  rowKey: string;

  /**
   * @kind string | number
   * @required false
   * @default -
   * @description 升序/降序，可以设置成 ${QUERY.order}。
   */
  @property({
    attribute: false,
  })
  order: string | number;

  /**
   * @kind string
   * @required false
   * @default -
   * @description 前端搜索参数
   */
  @property({
    attribute: false,
  })
  frontSearchQuery = "";

  /**
   * @kind RowDisabledProps
   * @required false
   * @default -
   * @description 配置每一行是否禁用，其中 `filed` 表示数据源中的字段路径， `value` 表示与其字段比较的值， `operator` 表示两者比较的方法，结果为 `true` 时会禁用当前行, 需要注意的是该配置需要在 `rowSelection: true` 的前提下使用，并且设置 `rowKey` 属性赋予每行唯一的 key，防止顺序变化时造成的错误勾选（如上 demo 所示）
   */
  @property({
    attribute: false,
  })
  rowDisabledConfig: RowDisabledProps;

  // start -- 行展开相关属性
  /**
   * @kind {useBrick:UseBrickConf}
   * @required false
   * @default -
   * @description 自定义行展开的构件
   */
  @property({
    attribute: false,
  })
  expandedRowBrick: {
    useBrick?: UseBrickConf;
  };

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 展开的图标是否为一个单元格，默认显示在第一列；设置为 false 的时候，可以通过`expandIconColumnIndex`属性设置展开的图标在哪一列
   */
  @property({
    attribute: false,
  })
  expandIconAsCell = true;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 通过点击行来展开子行
   */
  @property({
    type: Boolean,
  })
  expandRowByClick: boolean;

  /**
   * @kind number
   * @required false
   * @default -
   * @description 展开的图标显示在哪一列，如果没有 rowSelection，默认显示在第一列，否则显示在选择框后面。当`expandIconAsCell`为 false 时，该属性生效。
   */
  @property({
    type: Number,
  })
  expandIconColumnIndex: number;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 初始时，是否展开所有行
   */
  @property({
    type: Boolean,
  })
  defaultExpandAllRows: boolean;

  /**
   * @kind string[]
   * @required false
   * @default -
   * @description 展开的行的 rowKey
   */
  @property({
    attribute: false,
  })
  expandedRowKeys: string[];

  // end -- 行展开相关属性

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 表格树形数据展示的时候，行选择父节点的时候是否同步勾选/取消勾选所有子节点，并且被同步勾选的子节点不能单独取消。注意，该属性必须设置 `rowKey` 属性。
   */
  @property({
    type: Boolean,
  })
  selectAllChildren: boolean;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否默认选择所有行。注意，该属性必须设置 `rowKey` 属性。
   */
  @property({
    type: Boolean,
  })
  defaultSelectAll: boolean;

  private _disabledChildrenKeys: React.Key[] = [];

  /**
   * @kind string
   * @required false
   * @default children
   * @description 指定树形结构的列名
   */
  @property({
    attribute: false,
  })
  childrenColumnName = "children";

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 是否支持排序。默认开启，当对应列的sorter设置成true时则可排序。sortable为false时则排序都不生效。
   */
  @property({
    attribute: false,
  })
  sortable = true;

  /**
 * @kind {
  collapsedIcon: MenuIcon,
  expandedIcon: MenuIcon
}
 * @required false
 * @default {collapsedIcon:{lib:'antd',icon:'down',theme:'outlined'},expandedIcon:{lib:'antd',icon:'right',theme:'outlined'}}
 * @description 自定义展开图标。
 */
  @property({
    attribute: false,
  })
  expandIcon: {
    collapsedIcon: MenuIcon;
    expandedIcon: MenuIcon;
  };

  /**
   * @kind string
   * @required false
   * @default "q"
   * @description 把过滤条件更新到 url 时的字段名
   */
  @property({ attribute: false })
  qField = "q";

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description [已废弃]请用 tableDraggable 代替
   */
  @property({
    __deprecated_and_for_compatibility_only: true,
  })
  draggable: boolean;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 表格行是否可拖拽，注意，树形数据的表格不支持该功能
   */
  @property({
    type: Boolean,
  })
  tableDraggable: boolean;

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否展示斑马纹
   */
  @property({
    type: Boolean,
  })
  zebraPattern: boolean;
  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 翻页时是否记住之前选中的项。注意，选中项的rowKey将保存在url中，如果不设置rowKey，该设置不生效。如果选择太多可能会造成url过长，请谨慎使用
   */
  @property({ type: Boolean })
  storeCheckedByUrl: boolean;

  // 对外获取内部 _dataSource 的值
  // istanbul ignore next
  get processedDataSource() {
    return this._dataSource;
  }

  // 对外获取内部 _columns 的值
  // istanbul ignore next
  get processedColumns() {
    return this.getModifyColumns();
  }

  private _originalDataSource: Record<string, any>[];
  private _dataSource: Record<string, any>[];
  private _pureSource: Record<string, any>[];
  private _columns: CustomColumn[];
  private _finalConfigProps: any = {}; //处理过的配置，主要处理分页和rowSelect
  private _error: any;

  private _total: number;

  private _selectUpdateEventName = "";
  private _selectUpdateEventDetailKeys: string[] = [];
  private _selectUpdateEventDetailField = "";
  private _selectUpdateEventDetailExtra: any = {};

  private _fields: {
    dataSource?: string; // 指定 dataSource 从哪里来，默认为列表接口返回格式是{list:[],page:1,pageSize:10,total:20}，即默认取自 list
    total?: string; // 指定 total 从哪里来，默认为列表接口返回格式是{list:[],page:1,pageSize:10,total:20}，即默认取自 total
    rowKey?: string | number; // 指定每一行的 key，不指定则默认为 index
    page?: string; // 指定请求后台 page 参数 path
    pageSize?: string; // 指定请求后台 pageSize 参数 path
    ascend?: string | number; // 指定 ascend 排序对应字段，例如有些后台对应为 1 ，有些对应为 "asc"。这里默认为 "ascend"。
    descend?: string | number; // 指定 descend 排序对应字段，例如有些后台对应为 0 ，有些对应为 "desc"。这里默认为 "descend"。
  } = {
    page: "page",
    pageSize: "pageSize",
    dataSource: "list",
    total: "total",
    ascend: "ascend",
    descend: "descend",
  };

  /**
   * @default []
   * @required false
   * @description 指定选中项的 key 数组
   */
  @property({
    attribute: false,
  })
  selectedRowKeys: React.Key[] = [];

  private _selected = false;
  private _selectedRows: Record<string, any>[] = [];
  private _allChildren: Record<string, any>[] = [];
  private _isInSelect = false;
  connectedCallback(): void {
    // istanbul ignore else
    if (!this.style.display) {
      this.style.display = "block";
    }
    this._render();
  }

  disconnectedCallback(): void {
    ReactDOM.unmountComponentAtNode(this);
  }

  // 搜索过滤
  filterSourceData(event: CustomEvent): void {
    const q = event.detail.q.trim().toLowerCase();
    if (this.shouldUpdateUrlParams) {
      const history = getHistory();
      const urlSearchParams = new URLSearchParams(history.location.search);
      if (q) {
        urlSearchParams.set(this.qField, q);
        history.push(`?${urlSearchParams}`, { notify: !this.frontSearch });
      } else {
        urlSearchParams.delete(this.qField);
        history.push(`?${urlSearchParams}`, { notify: !this.frontSearch });
      }
    }
    this.frontSearchQuery = q;
  }

  handleFrontendDataChange(
    data: Record<string, any>[] = [],
    columns: CustomColumn[] = []
  ): Record<string, any>[] {
    if (this.shouldUpdateUrlParams) {
      const history = getHistory();
      const urlSearchParams = new URLSearchParams(history.location.search);
      this.frontSearchQuery = urlSearchParams.get(this.qField);
    }
    let tempDataSource: Record<string, any>[] = [];
    tempDataSource = this.handleFrontendFilterSource(
      data,
      this.frontSearchQuery || "",
      columns
    );
    const order = isNil(this.order)
      ? null
      : this._fields.ascend === this.order
      ? "ascend"
      : "descend";
    tempDataSource = this.handleFrontendSorter(tempDataSource, {
      columnKey: this.sort,
      order,
    });
    tempDataSource = this.handleFrontendFilters(tempDataSource);
    this._total = tempDataSource.length;
    return tempDataSource;
  }

  // 前端过滤
  handleFrontendFilterSource(
    data: Record<string, any>[],
    q: string,
    columns: CustomColumn[]
  ): Record<string, any>[] {
    const filterKeys =
      this.frontSearchFilterKeys || columns.map((column) => column.dataIndex);
    const dataSource = data.filter((item) => {
      const valid = filterKeys.map((key) => {
        const value = get(item, key);
        if (isNil(value)) {
          return false;
        }
        return JSON.stringify(value).toLowerCase().includes(q);
      });
      return valid.includes(true);
    });
    return dataSource;
  }

  private _handleRowSelectChange = (
    selectedRowKeys: any,
    selectedRows: any[]
  ): void => {
    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    this._selectedRows = selectedRows;
    if (this._selected) {
      this._selectedRows = uniqBy(
        [...selectedRows, ...this._allChildren],
        rowKey
      );
    } else {
      this._selectedRows = pullAllBy(selectedRows, this._allChildren, rowKey);
    }
    this.selectedRowKeys = map(this._selectedRows, rowKey);

    let detail = null;
    const data = isEmpty(this._selectUpdateEventDetailField)
      ? this._selectedRows
      : map(this._selectedRows, (row) =>
          get(row, this._selectUpdateEventDetailField)
        );
    detail =
      isEmpty(this._selectUpdateEventDetailKeys) || isEmpty(data)
        ? data
        : set({}, this._selectUpdateEventDetailKeys, data);
    if (!isEmpty(detail)) {
      detail = merge(detail, this._selectUpdateEventDetailExtra);
    }
    if (!this._selectUpdateEventName) {
      this.selectUpdate.emit(detail);
    } else {
      const eventName = this._selectUpdateEventName
        ? this._selectUpdateEventName
        : "select.update";
      this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  };

  // istanbul ignore next
  private _getSelectedRowsWithChildren = (
    row: Record<string, any>
  ): Record<string, any>[] => {
    const result: Record<string, any>[] = [];
    if (
      !isEmpty(row[this.childrenColumnName]) &&
      isArray(row[this.childrenColumnName])
    ) {
      forEach(row[this.childrenColumnName], (item) => {
        result.push(item);
        result.push(...this._getSelectedRowsWithChildren(item));
      });
    }
    return result;
  };

  // istanbul ignore next
  private _handleOnSelect = (
    row: Record<string, any>,
    checked: boolean,
    selectedRows: Record<string, any>[]
  ): void => {
    this._selected = checked;
    this._isInSelect = true;
    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    const allChildren = this.selectAllChildren
      ? this._getSelectedRowsWithChildren(row)
      : [];

    this._allChildren = allChildren;
    if (checked) {
      this._disabledChildrenKeys = uniq([
        ...this._disabledChildrenKeys,
        ...map(allChildren, rowKey),
      ]);
    } else {
      this._disabledChildrenKeys = pullAll(this._disabledChildrenKeys, [
        ...map(allChildren, rowKey),
      ]);
    }
    if (this.storeCheckedByUrl && !!rowKey) {
      this._updateUrlChecked([row[rowKey]], checked);
    }
  };

  // istanbul ignore next
  private _handleSelectAll = (
    selected: boolean,
    selectedRows: Record<string, any>[],
    changeRows: Record<string, any>[]
  ): void => {
    this._selected = selected;
    this._isInSelect = true;
    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    if (this.selectAllChildren) {
      const allParentKeys = map(this._dataSource, rowKey);
      const changedParentRows = changeRows.filter((v) =>
        allParentKeys.includes(v[rowKey])
      );
      const toChangedChildrenKeys = flatten(
        map(changedParentRows, (r) =>
          map(this._getSelectedRowsWithChildren(r), (cr) => cr[rowKey])
        )
      );
      const allChildren = flatten(
        map(changedParentRows, (r) =>
          map(this._getSelectedRowsWithChildren(r), (cr) => cr)
        )
      );
      this._allChildren = allChildren;

      if (selected) {
        this._disabledChildrenKeys = uniq(
          this._disabledChildrenKeys.concat(toChangedChildrenKeys)
        );
      } else {
        // disabled children in changeRows should be removed
        this._disabledChildrenKeys = this._disabledChildrenKeys.filter(
          (v) => !toChangedChildrenKeys.includes(v)
        );
      }
    }
    if (this.storeCheckedByUrl && !!rowKey) {
      this._updateUrlChecked(map(changeRows, rowKey), selected);
    }
  };

  private _getCheckedFromUrl = () => {
    const history = getHistory();
    const urlSearchParams = new URLSearchParams(history.location.search);
    const checked = urlSearchParams.get("checked");
    return isEmpty(checked) ? [] : checked.split(",");
  };

  private _updateUrlChecked = (options: any[], checked) => {
    const history = getHistory();
    let checkedOptions: string[] = this._getCheckedFromUrl();
    if (checked) {
      checkedOptions = [...checkedOptions, ...options];
    } else {
      pull(checkedOptions, ...options);
    }
    if (this.shouldUpdateUrlParams) {
      history.pushQuery(
        { checked: checkedOptions.join(",") },
        { notify: false }
      );
    }
  };
  private _handleOnChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, string[]>,
    sorter: SorterResult<Record<string, any>>
  ): void => {
    const history = getHistory();
    const urlSearchParams = new URLSearchParams(history.location.search);
    // 分页
    if (!isEmpty(pagination)) {
      if (pagination.pageSize !== this.pageSize) {
        pagination.current = 1;
        urlSearchParams.set("page", "1");
        urlSearchParams.set("pageSize", pagination.pageSize.toString());
        this.filterUpdate.emit({
          [this._fields.pageSize]: pagination.pageSize,
          [this._fields.page]: 1,
        });
        this.page = 1;
        this.pageSize = pagination.pageSize;
      } else if (pagination.current !== this.page) {
        const newPage = pagination.current || 1;
        urlSearchParams.set("page", newPage.toString());
        this.pageUpdate.emit({
          [this._fields.page]: newPage, // 可配置的 path
        });
        this.page = newPage;
      }
    }
    this.filters = filters;
    // 过滤
    if (!isEmpty(filters)) {
      forEach(filters, (value: any, key) => {
        urlSearchParams.set(key, value);
      });
    }
    // 排序
    if (
      sorter.columnKey !== this.sort ||
      this._fields[sorter.order] !== this.order
    ) {
      if (sorter.columnKey && sorter.order) {
        urlSearchParams.set("sort", sorter.columnKey as string);
        urlSearchParams.set("order", this._fields[sorter.order].toString());
        this.sort = sorter.columnKey as string;
        this.order = this._fields[sorter.order];
      } else {
        urlSearchParams.delete("sort");
        urlSearchParams.delete("order");
        this.sort = null;
        this.order = null;
      }
      this.sortUpdate.emit({
        sort: this.sort,
        order: this.order,
      });
    }
    if (this.frontSearch) {
      if (this.shouldUpdateUrlParams) {
        history.push(`?${urlSearchParams}`, { notify: false });
      }
      this.frontendSearch(pagination, filters, sorter);
    } else {
      if (this.shouldUpdateUrlParams) {
        history.push(`?${urlSearchParams}`, {
          notify: !!this.shouldRenderWhenUrlParamsUpdate,
        });
      }
    }
  };

  private renderSelectInfo = () => {
    // eslint-disable-next-line react/display-name
    return (
      <span style={{ marginLeft: 20 }}>
        <span>已选择 {this.selectedRowKeys.length} 项</span>
        <a
          role="button"
          onClick={() => {
            this.selectedRowKeys = [];
            this._selectedRows = [];
            this._disabledChildrenKeys = [];
            this._allChildren = [];
          }}
        >
          {" "}
          清空
        </a>
      </span>
    );
  };

  // 对前端搜索数据进行排序
  private handleFrontendSorter(
    dataSource: Record<string, any>[],
    sorter: Partial<SorterResult<Record<string, any>>>
  ): Record<string, any>[] {
    const tempDataSource: Record<string, any>[] = dataSource || [];
    const columnKey = sorter.columnKey;
    let direction: 1 | -1;

    if (sorter.order === "descend") {
      direction = -1;
    } else if (sorter.order === "ascend") {
      direction = 1;
    }

    if (direction !== undefined) {
      tempDataSource.sort((a, b) => {
        const aValue = get(a, columnKey);
        const bValue = get(b, columnKey);

        if (isNil(aValue)) {
          if (!isNil(bValue)) {
            return 1;
          }
        } else {
          if (isNil(bValue)) {
            return -1;
          }
        }

        if (aValue == bValue) {
          return 0;
        }

        if (aValue > bValue) {
          return direction;
        }

        return -direction;
      });
    }

    return tempDataSource;
  }

  // 对前端搜索数据进行表头筛选项过滤
  private handleFrontendFilters(
    dataSource: Record<string, any>[]
  ): Record<string, any>[] {
    let tempDataSource: Record<string, any>[] = dataSource || [];
    const filtersArray = map(this.filters, (item, k) => ({
      key: k,
      value: item,
    }));
    tempDataSource = tempDataSource.filter((item) => {
      return every(filtersArray, (filter) => {
        return filter.value?.includes(get(item, filter.key));
      });
    });
    return tempDataSource;
  }

  // istanbul ignore next
  private frontendSearch(
    pagination: TablePaginationConfig,
    filters: Record<string, string[]>,
    sorter: SorterResult<Record<string, any>>
  ): void {
    this.sort = isNil(sorter.order) ? null : (sorter.columnKey as string);
    this.order = isNil(sorter.order) ? null : this._fields[sorter.order];
  }

  // 点击展开图标时触发的事件
  // istanbul ignore next
  private _handleOnExpand = (
    expanded: boolean,
    record: Record<string, any>
  ): void => {
    if (this.expandedRowKeys) {
      const rowKey =
        this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
      const pullKeys: string[] = [get(record, rowKey)];
      const recordChildren = get(record, this.childrenColumnName);
      if (!isEmpty(recordChildren)) {
        const keysToPull = map(
          filter(recordChildren, (c) =>
            isEmpty(get(c, this.childrenColumnName))
          ),
          rowKey
        );
        pullKeys.push(...keysToPull);
      }
      this.expandedRowKeys = expanded
        ? [...this.expandedRowKeys, ...pullKeys]
        : pull(this.expandedRowKeys, ...pullKeys);
      this._render();
    }
    this.rowExpand.emit({
      expanded,
      record,
    });
  };

  // 展开的行变化时触发的事件
  // istanbul ignore next
  private _handleOnExpandedRowsChange = (expandedRows: React.Key[]): void => {
    this.expandRowsChange.emit({
      expandedRows,
    });
  };

  // 拖拽排序后触发的事件
  // istanbul ignore next
  private _handleOnDrag = (data: Record<string, any>[]): void => {
    this.rowDrag.emit({
      data,
    });
  };

  /**
   * @description 展开所有行
   */
  @method()
  expandAll() {
    const allKeys: string[] = [];
    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    getKeysOfData(this._dataSource, rowKey, this.childrenColumnName, allKeys);
    this.expandedRowKeys = allKeys;
  }

  getModifyColumns(): CustomColumn[] {
    let columns = this._columns;
    if (this._columns && this.hiddenColumns) {
      columns = this._columns.filter((column) => {
        return !this.hiddenColumns.includes(
          (column.dataIndex as string) ?? column.key
        );
      });
    }
    if (this.sortable === false) {
      columns = map(columns, (column) => {
        column.sorter = false;
        return column;
      });
    }
    return columns;
  }

  protected _render(): void {
    if (this.isConnected) {
      if (this.draggable) {
        // eslint-disable-next-line no-console
        console.warn(
          "`draggable` of `<presentational-bricks.brick-table>` is deprecated, use `tableDraggable` instead."
        );
      }
      // 前端搜索的参数处理
      if (this.frontSearch) {
        this._dataSource = this.handleFrontendDataChange(
          this._pureSource,
          this._columns
        );
      }

      this._initConfigProps();
      ReactDOM.render(
        <BrickWrapper wrapperConfig={this.wrapperConfig}>
          <BrickTable
            dataSource={this._dataSource}
            columns={this.getModifyColumns()}
            configProps={this._finalConfigProps}
            error={this._error}
            onChange={this._handleOnChange}
            showCard={this.showCard}
            expandedRowBrick={this.expandedRowBrick}
            expandIconAsCell={this.expandIconAsCell}
            expandIconColumnIndex={this.expandIconColumnIndex}
            expandRowByClick={this.expandRowByClick}
            defaultExpandAllRows={this.defaultExpandAllRows}
            onExpand={this._handleOnExpand}
            onExpandedRowsChange={this._handleOnExpandedRowsChange}
            expandedRowKeys={this.expandedRowKeys}
            rowKey={this.rowKey ?? (this._fields.rowKey as string)}
            childrenColumnName={this.childrenColumnName}
            tableDraggable={this.tableDraggable || this.draggable}
            onDrag={this._handleOnDrag}
            zebraPattern={this.zebraPattern}
            expandIcon={this.expandIcon}
            scroll={this.scrollConfigs}
            optimizedColumns={this.optimizedColumns}
          />
        </BrickWrapper>,
        this
      );
    }
  }

  // istanbul ignore next
  private _getAllRows = (): Record<string, any>[] => {
    const allRows: Record<string, any>[] = [];
    getRowsOfData(this._dataSource, this.childrenColumnName, allRows);
    return allRows;
  };

  // istanbul ignore next
  private _handleDefaultSelectAll = () => {
    this._isInSelect = true;
    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    this._selectedRows = this._getAllRows();
    this.selectedRowKeys = map(this._selectedRows, rowKey);
    return this.selectedRowKeys;
  };

  private _initConfigProps = () => {
    // 默认分页配置
    const defaultPagination: TablePaginationConfig = {
      current: this.page,
      pageSize: this.pageSize,
      total: this._total,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "50"],
      // eslint-disable-next-line react/display-name
      showTotal: (totals) => (
        <>
          <span className={paginationStyle.totalText}>
            {i18n.t(`${NS_PRESENTATIONAL_BRICKS}:${K.PAGINATION_TOTAL_TEXT}`)}{" "}
            <strong className={paginationStyle.total}>{totals}</strong>{" "}
            {i18n.t(`${NS_PRESENTATIONAL_BRICKS}:${K.PAGINATION_TOTAL_UNIT}`)}
          </span>
          {this.configProps?.rowSelection &&
            this.showSelectInfo &&
            this.renderSelectInfo()}
        </>
      ),
    };

    const rowKey =
      this.rowKey ?? this._fields.rowKey ?? this.configProps?.rowKey;
    if (this.configProps) {
      this._finalConfigProps = cloneDeep(this.configProps);
      this._finalConfigProps.pagination = this.configProps.pagination !==
        false && {
        ...defaultPagination,
        ...this.configProps.pagination,
      };
      if (this.configProps.rowSelection) {
        // 当 rowSelection 为 true 或者有相关配置的时候的默认行选择配置
        const defaultRowSelection: TableRowSelection<any> = {
          ...(rowKey
            ? {
                selectedRowKeys: this._isInSelect
                  ? this.selectedRowKeys
                  : this.storeCheckedByUrl
                  ? this._getCheckedFromUrl()
                  : this.defaultSelectAll
                  ? this._handleDefaultSelectAll()
                  : this.selectedRowKeys,
                onSelect: this._handleOnSelect,
                onSelectAll: this._handleSelectAll,
                onChange: this._handleRowSelectChange,
                preserveSelectedRowKeys: true,
              }
            : {
                // 当用户没有设置rowKey时的兼容处理
                onChange: this._handleRowSelectChange,
                preserveSelectedRowKeys: true,
              }),
          getCheckboxProps: (record: any) => {
            if (
              !isEmpty(this._disabledChildrenKeys) &&
              this._disabledChildrenKeys.includes(get(record, rowKey))
            ) {
              return {
                disabled: true,
              };
            }
            if (!this.rowDisabledConfig) return {};

            const { field, value, operator } = this.rowDisabledConfig;

            const fun = compareFunMap[operator];
            return {
              disabled: fun?.(value, get(record, field)),
            };
          },
        };
        if (this.configProps.rowSelection === true) {
          this._finalConfigProps.rowSelection = defaultRowSelection;
        } else {
          this._finalConfigProps.rowSelection = {
            ...defaultRowSelection,
            ...this.configProps.rowSelection,
            ...(defaultRowSelection.selectedRowKeys
              ? { selectedRowKeys: defaultRowSelection.selectedRowKeys }
              : {}),
          };
        }
      }
    } else {
      this._finalConfigProps = {
        pagination: defaultPagination,
      };
    }

    // 初始化列排序
    if (this._columns) {
      this._columns = this._columns.map((item) => {
        if (isNil(item.key)) {
          item.key = item.dataIndex as string;
        }
        if (item.sorter) {
          item.sortOrder = (this.sort === item.key &&
            !isNil(this.order) &&
            (this._fields.ascend === this.order
              ? "ascend"
              : "descend")) as SortOrder;
        }
        // 初始化表头过滤值
        if (item.filters) {
          const history = getHistory();
          const urlSearchParams = new URLSearchParams(history.location.search);
          const filteredValue =
            urlSearchParams.get(item.key as string) ??
            get(this.filters, item.key)?.join(",");
          if (!isNil(filteredValue) && !isEmpty(filteredValue)) {
            item.filtered = true;
            item.filteredValue = filteredValue
              .split(",")
              .map(
                (v) =>
                  find(item.filters, (f) => String(f.value) === v)?.value ?? v
              );
          } else {
            item.filtered = false;
            item.filteredValue = [];
          }
        }
        return item;
      });
    }
  };

  /**
   * @kind any
   * @required false
   * @default -
   * @description 数据源，通过 useResolves 从后台接口获取或者直接在 storyboard 中配置
   */
  set dataSource(value: Record<string, any>[]) {
    this._isInSelect = false;
    this._originalDataSource = value;
    this._dataSource = cloneDeep(
      this._fields.dataSource ? get(value, this._fields.dataSource) : value
    );
    // 前端搜索需要保留一个干净的数据
    this._pureSource = cloneDeep(this._dataSource);
    if (this.stripEmptyExpandableChildren) {
      const columnName =
        this.configProps?.expandable?.childrenColumnName || "children";
      stripEmptyExpandableChildrenByName(columnName, this._dataSource);
    }
    this._total = get(value, this._fields.total);
    this.page = this.page ?? (get(value, "page") || 1);
    this.pageSize =
      this.pageSize ??
      (get(value, "page_size") || get(value, "pageSize") || 10);
    this._render();
  }

  _test_only_getOriginalDataSource(): Record<string, any>[] {
    return this._originalDataSource;
  }

  updateData(event: CustomEvent): void {
    this._dataSource = event.detail;
    this._error = null;
    this._render();
  }

  updateError(event: CustomEvent): void {
    this._error = event.detail;
    this._render();
  }

  set selectUpdateEventName(value: string) {
    this._selectUpdateEventName = value;
  }

  set selectUpdateEventDetailKeys(value: string[]) {
    this._selectUpdateEventDetailKeys = value;
  }

  set selectUpdateEventDetailField(value: string) {
    this._selectUpdateEventDetailField = value;
  }

  set selectUpdateEventDetailExtra(value: any) {
    this._selectUpdateEventDetailExtra = value;
  }

  /**
   * @kind CustomColumn[]
   * @required false
   * @default -
   * @description 扩展自 ant-design 的 Column 相关配置项,具体查阅：<a href="https://ant.design/components/table-cn/#Column" target="_blank">https://ant.design/components/table-cn/#Column</a>
   */
  set columns(value: CustomColumn[]) {
    this._columns = value;
    this._render();
  }
  get columns(): CustomColumn[] {
    return this._columns;
  }

  /**
   * @kind object
   * @required false
   * @default -
   * @description ant-design 的 Table 相关配置项,具体查阅：[https://ant.design/components/table-cn/#Table](https://ant.design/components/table-cn/#Table)，其中分页配置和行选择配值在构件中设置了常用的默认配置，也可自行覆盖，具体描述见下表
   */
  @property({
    attribute: false,
  })
  configProps: any;

  /**
   * @kind boolean
   * @required false
   * @default true
   * @description 是否显示外层卡片
   */
  @property({
    attribute: false,
  })
  showCard = true;

  /**
   * @kind object
   * @required false
   * @default -
   * @description 设置相关字段取自哪里，具体描述见下表
   */
  set fields(value: any) {
    this._fields = { ...this._fields, ...value };
    this._render();
  }

  /**
   * @kind boolean
   * @required false
   * @default false
   * @description 是否前端进行搜索，配合`presentational-bricks.brick-input`使用
   */
  @property({
    type: Boolean,
  })
  frontSearch: boolean;

  /**
   * @kind string[]
   * @required false
   * @default -
   * @description 进行前端搜索的字段，支持嵌套的写法如["name","value.a"]，不配置的时候默认为对所有 columns 的 dataIndex[]进行前端搜索
   */
  @property({
    attribute: false,
  })
  frontSearchFilterKeys: string[];

  /**
   * @kind {
   *   x?: string | number | true;
   *   y?: number | string;
   * } & {
   *   scrollToFirstRowOnChange?: boolean;
   * }
   * @required false
   * @default -
   * @description 表格是否可滚动，也可以指定滚动区域的宽、高，配置项。详见 https://ant.design/components/table-cn/#scroll
   */
  @property({
    attribute: false,
  })
  scrollConfigs: TableProps<unknown>["scroll"];
}

customElements.define("presentational-bricks.brick-table", BrickTableElement);
