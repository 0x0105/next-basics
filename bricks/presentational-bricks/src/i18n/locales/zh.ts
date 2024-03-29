import { Locale, K } from "../constants";

const locale: Locale = {
  [K.AGENT_STATUS_NORMAL]: "正常",
  [K.AGENT_STATUS_ABNORMAL]: "异常",
  [K.AGENT_STATUS_NOT_INSTALLED]: "未安装",
  [K.AGENT_STATUS_UNINSTALLED]: "已卸载",
  [K.AGENT_STATUS_UNDER_MAINTENANCE]: "维护中",
  [K.ALERT_MSG_SENDED]: "告警已发送",
  [K.ALERT_CONVERGED]: "告警被收敛",
  [K.ALERT_RECOVERED]: "告警已恢复",
  [K.ALERT_MANUAL_RECOVERED]: "人工恢复",
  [K.ALERT_SHIELDED]: "告警被屏蔽",
  [K.PRESENTATIONAL_BRICKS]: "Presentational Bricks",
  [K.PAGINATION_TOTAL_TEXT]: "共",
  [K.PAGINATION_TOTAL_UNIT]: "条",
  [K.UNKNOWN_ERROR]: "未知错误",
  [K.NO_DATA]: "暂无数据",
  [K.COLLECTION_INSTANCE_SYNCHRONIZE]: "同步实例",
  [K.COLLECTION_INSTANCE_EXECUTE]: "立即采集",
  [K.DELETE]: "删除",
  [K.CROP_TITLE]: "修改头像",
  [K.COPY]: "复制",
  [K.COPIED]: "复制成功",
};

export default locale;
