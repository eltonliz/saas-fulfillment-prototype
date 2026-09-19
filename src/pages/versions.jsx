import React from "react";

/* ============================================================================
   版本记录 —— 进销存改造版（当前版本）
   ============================================================================ */

const VERSIONS = [
  {
    v: "V1.0",
    date: "2026-09-19",
    type: "进销存改造版",
    scope: "四端",
    items: [
      "完成进销存改造：租户后台新增「进销存」菜单，含发货管理、收货管理、配送差异、退货返厂；供应商后台对应「供货」；改动处均用红框标注",
      "门店 APP 打通收货闭环与退货返厂：确认收货时实收不可超过应收，少收必须填写备注、上传凭证",
      "自提订单的提货码改为「全部到货后才生效」，客户到店核销完成订单",
      "新增业务流程图、场景清单，并为每个页面配上需求注释，说明业务规则、数据流转与异常处理",
    ],
  },
];

export function VersionLog() {
  return (
    <div>
      <div className="tbl-wrap" style={{ marginBottom: 22 }}>
        <table className="tbl-tight">
          <thead>
            <tr>
              <th style={{ minWidth: 56 }}>版本</th>
              <th style={{ minWidth: 110 }}>日期</th>
              <th style={{ minWidth: 110 }}>类型</th>
              <th style={{ minWidth: 460 }}>更新内容</th>
              <th style={{ minWidth: 90 }}>涉及端</th>
            </tr>
          </thead>
          <tbody>
            {VERSIONS.map((r) => (
              <tr key={r.v}>
                <td className="mono" style={{ verticalAlign: "top", fontWeight: 600 }}>{r.v}</td>
                <td className="mono" style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{r.date}</td>
                <td style={{ verticalAlign: "top" }}>{r.type}</td>
                <td style={{ verticalAlign: "top", lineHeight: 1.8 }}>
                  {r.items.map((it, i) => <div key={i}>· {it}</div>)}
                </td>
                <td style={{ verticalAlign: "top" }}>{r.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
